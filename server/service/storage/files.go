package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path"
	"path/filepath"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
)

// File handlers work inside a medium that is not attached to the target
// machine. A medium the target machine owns is refused by openMedium: the two
// of us writing one filesystem is how it gets destroyed.

// uploadMaxBytes is a hard ceiling for a single upload, so a runaway request
// cannot fill the medium before the free space check has had its say.
const uploadMaxBytes = 8 << 30

func (s *Service) ListMediaFiles(c *gin.Context) {
	var rsp proto.Response

	mediaType := c.Query("type")
	rel := c.Query("rel")
	dir, err := utils.ValidateMediumPath(c.Query("path"))
	if err != nil {
		respondError(c, err)
		return
	}

	if mediaType == proto.MediaTypePartition {
		invalidatePartitionCache()
	}

	image, err := openMedium(mediaType, rel, false)
	if err != nil {
		respondError(c, err)
		return
	}
	defer closeMedia(image)

	entries, err := image.List(dir)
	if err != nil {
		respondError(c, fmt.Errorf("list %s: %w", dir, err))
		return
	}

	files := make([]proto.MediaFile, 0, len(entries))
	for _, entry := range entries {
		files = append(files, proto.MediaFile{
			Name:     entry.Name,
			Size:     entry.Size,
			IsDir:    entry.IsDir,
			Modified: entry.ModTime,
		})
	}

	total, free, _ := image.StatFS()

	rsp.OkRspWithData(c, &proto.GetMediaFilesRsp{
		Path:    dir,
		Entries: files,
		Free:    free,
		Total:   total,
		Writing: mediaType == proto.MediaTypePartition && partitionWriting(),
	})

	log.Debugf("list media files success, %s/%s total %d", rel, dir, len(files))
}

func (s *Service) DownloadMediaFile(c *gin.Context) {
	var rsp proto.Response

	rel := c.Query("rel")
	entryPath, err := utils.ValidateMediumPath(c.Query("path"))
	if err != nil {
		respondError(c, err)
		return
	}
	if entryPath == "/" {
		rsp.ErrRsp(c, codeInvalidArgument, "a file path is required")
		return
	}

	if c.Query("type") == proto.MediaTypePartition {
		invalidatePartitionCache()
	}

	image, err := openMedium(c.Query("type"), rel, false)
	if err != nil {
		respondError(c, err)
		return
	}
	defer closeMedia(image)

	file, entry, err := image.Open(entryPath)
	if err != nil {
		respondError(c, fmt.Errorf("open %s: %w", entryPath, err))
		return
	}
	defer func() {
		_ = file.Close()
	}()

	// The download streams straight out of the mounted image; ServeContent adds
	// range support and the headers a browser download needs.
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", path.Base(entryPath)))
	c.Header("Content-Type", "application/octet-stream")
	http.ServeContent(c.Writer, c.Request, entry.Name, entry.ModTime, file)
}

func (s *Service) UploadMediaFile(c *gin.Context) {
	var rsp proto.Response

	// The medium travels in the query string so the multipart body holds
	// nothing but the file: reading a form field would make net/http buffer the
	// whole upload in memory before the medium could even be opened.
	mediaType := c.Query("type")
	rel := c.Query("rel")
	dir, err := utils.ValidateMediumPath(c.Query("path"))
	if err != nil {
		respondError(c, err)
		return
	}

	// Content-Length covers the multipart framing as well, so it is an upper
	// bound on the file: good enough to refuse an upload that cannot fit.
	size := c.Request.ContentLength

	image, err := openMedium(mediaType, rel, true)
	if err != nil {
		respondError(c, err)
		return
	}
	defer closeMedia(image)

	if free, _, err := image.StatFS(); err == nil && size > 0 && uint64(size) > free {
		respondError(c, fmt.Errorf("%w: the medium has %d MiB free", errNoSpace, free>>20))
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, uploadMaxBytes)

	reader, err := c.Request.MultipartReader()
	if err != nil {
		rsp.ErrRsp(c, codeInvalidArgument, "invalid multipart request")
		return
	}

	part, err := nextFilePart(reader)
	if err != nil {
		respondError(c, err)
		return
	}
	defer func() {
		_ = part.Close()
	}()

	name, err := uploadName(part.FileName())
	if err != nil {
		respondError(c, err)
		return
	}

	target := name
	if dir != "/" {
		target = path.Join(dir, name)
	}

	// An upload is a long transfer like any other: it takes the single job
	// slot so the web UI can report progress and nothing else writes to the
	// data partition while it runs.
	done, err := s.beginJob(c.Request.Context(), target)
	if err != nil {
		respondError(c, err)
		return
	}

	// The upload is read from rather than written to, so the progress writer
	// only counts: the bytes go to the medium through the tee.
	progress := utils.NewProgressWriter(io.Discard, size, func(loaded, total int64) {
		s.setJobProgress(done, loaded, total)
	})
	defer progress.Stop()

	written, err := image.Write(target, io.TeeReader(part, progress))
	if err != nil {
		s.finishJob(done, jobStateFailed, err.Error())
		respondError(c, err)
		return
	}
	s.finishJob(done, jobStateSuccess, "")

	rsp.OkRspWithData(c, &proto.MediaFile{Name: name, Size: written})
	log.Debugf("upload %s to medium %s success", target, rel)
}

func (s *Service) DeleteMediaFile(c *gin.Context) {
	var req proto.MediaPathReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, codeInvalidArgument, "invalid arguments")
		return
	}

	entryPath, err := utils.ValidateMediumPath(req.Path)
	if err != nil {
		respondError(c, err)
		return
	}
	if entryPath == "/" {
		rsp.ErrRsp(c, codeInvalidArgument, "a file path is required")
		return
	}

	image, err := openMedium(req.Type, req.Rel, true)
	if err != nil {
		respondError(c, err)
		return
	}
	defer closeMedia(image)

	if err := image.Remove(entryPath); err != nil {
		respondError(c, fmt.Errorf("remove %s: %w", entryPath, err))
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete %s from medium %s success", entryPath, req.Rel)
}

// nextFilePart walks the multipart body to the uploaded file, skipping any
// field that came before it.
func nextFilePart(reader *multipart.Reader) (*multipart.Part, error) {
	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			return nil, fmt.Errorf("%w: no file in the request", utils.ErrInvalidMediaPath)
		}
		if err != nil {
			return nil, fmt.Errorf("read multipart request: %w", err)
		}
		if part.FormName() != "file" {
			_ = part.Close()
			continue
		}
		return part, nil
	}
}

// uploadName reduces the browser supplied file name to something the medium
// can hold. The client picks it, so it is treated as untrusted.
func uploadName(raw string) (string, error) {
	name := filepath.Base(raw)
	if err := utils.ValidateFileName(name); err != nil {
		return "", err
	}
	return name, nil
}

func closeMedia(image io.Closer) {
	if err := image.Close(); err != nil {
		log.Errorf("close medium failed: %s", err)
	}
}
