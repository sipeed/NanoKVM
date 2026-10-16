package storage

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/storage/diskfs"
	"NanoKVM-Server/utils"
)

// File handlers work inside a medium that is not attached to the target
// machine. A medium the target machine owns is refused by openMedium: the two
// of us writing one filesystem is how it gets destroyed.

// uploadMaxBytes is a hard ceiling for a single upload, so a runaway request
// cannot fill the medium before the free space check has had its say.
const uploadMaxBytes = 8 << 30

// downloadTempPrefix is what the image downloader names the file it is writing
// while it is in flight. Like diskfs.UploadPrefix it is hidden from a listing
// and must survive until the transfer finishes.
const downloadTempPrefix = ".nanokvm-"

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
		// The watcher pushes "the shared files changed" for the folder the UI
		// has open, which is not necessarily its root, so it is told which one
		// that is. Listing anything else stops that watch.
		SetPartitionBrowsePath(dir)
		invalidatePartitionCache()
	} else {
		SetPartitionBrowsePath("")
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
	c.Header("Content-Disposition", attachmentHeader(path.Base(entryPath)))
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

	// A chunked request states no length, so the free space is what has to cap
	// it instead: without that, an upload that never ends could fill the medium.
	limit := int64(uploadMaxBytes)
	limitedBySpace := false
	if _, free, err := image.StatFS(); err == nil {
		if size > 0 {
			if uint64(size) > free {
				respondError(c, fmt.Errorf("%w: the medium has %d MiB free", errNoSpace, free>>20))
				return
			}
		} else if free < uint64(limit) {
			limit = int64(free)
			limitedBySpace = true
		}
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)

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

		var tooLarge *http.MaxBytesError
		if limitedBySpace && errors.As(err, &tooLarge) {
			respondError(c, fmt.Errorf("%w: the medium could not hold the upload", errNoSpace))
			return
		}

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

	// Our own transfer temporaries are not files to manage: deleting one while
	// its transfer writes it loses the data silently.
	if name := path.Base(entryPath); strings.HasPrefix(name, diskfs.UploadPrefix) || strings.HasPrefix(name, downloadTempPrefix) {
		respondError(c, fmt.Errorf("refusing to delete %s: it belongs to a running transfer", name))
		return
	}

	// Deleting through the shared partition has no loop mount to keep the
	// gadget away. Hold the operation lock until the unlink is done so a
	// concurrent mount cannot attach the file after the attachment check.
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	// A file the target machine is being served as its medium must not vanish
	// under it: the gadget keeps reading the inode it opened, so the target
	// machine would be left with a medium whose contents are already gone. A
	// directory is removed recursively, so the check covers everything below
	// the path as well, not just the path itself.
	if req.Type == proto.MediaTypePartition {
		full := filepath.Join(mediaDirectory, filepath.FromSlash(entryPath))
		if IsAttached(full) || attachedMediumInside(full) {
			respondError(c, errMediumAttached)
			return
		}
	}

	image, err := openMediumLocked(req.Type, req.Rel, true)
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
