package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/storage/diskfs"
	"NanoKVM-Server/utils"
)

// File handlers work inside a medium that is not attached to the target
// machine. A medium the target machine owns is refused by openMedium: the two
// of us writing one filesystem is how it gets destroyed.

// requireFileWrite picks the grant the medium in the request needs. One path
// serves two media types: an image holds library content (library.write), while
// the shared partition is what the emulated disk hands to the target machine, so
// writing into it belongs to medium.attach. The route admits either grant and
// this is the only place the pair is narrowed, because which one applies is not
// visible to a path-based rule.
func requireFileWrite(c *gin.Context, mediaType string) bool {
	permission := authn.PermLibraryWrite
	if mediaType == proto.MediaTypePartition {
		permission = authn.PermMediumAttach
	}

	principal, ok := middleware.CurrentPrincipal(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, "unauthorized")
		return false
	}
	if principal.Has(permission) {
		return true
	}

	c.JSON(http.StatusForbidden, "forbidden")
	return false
}

// requireLibraryWrite guards a write through the shared partition that changes
// the library. The library is every .iso and .img on the volume, wherever it
// was put (findImages walks all of /data), so creating, replacing or removing
// one through the partition changes it as much as the library endpoints do,
// and medium.attach alone must not reach that far.
func requireLibraryWrite(c *gin.Context) bool {
	principal, ok := middleware.CurrentPrincipal(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, "unauthorized")
		return false
	}
	if principal.Has(authn.PermLibraryWrite) {
		return true
	}

	c.JSON(http.StatusForbidden, "forbidden")
	return false
}

// holdsMedia reports whether full is a disk image or a directory with one
// anywhere below it.
func holdsMedia(full string) (bool, error) {
	info, err := os.Stat(full)
	if err != nil {
		if os.IsNotExist(err) {
			return utils.IsMediaFile(full), nil
		}
		return false, err
	}
	if !info.IsDir() {
		return utils.IsMediaFile(info.Name()), nil
	}

	found := false
	err = filepath.WalkDir(full, func(_ string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !entry.IsDir() && utils.IsMediaFile(entry.Name()) {
			found = true
			return filepath.SkipAll
		}
		return nil
	})
	return found, err
}

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
		// The browser tells the watcher every directory it is showing: the one
		// it listed plus the folders it has expanded. Watching only the last
		// one left the others stale until a manual refresh.
		SetPartitionWatchPaths(watchPaths(dir, c.Query("watch")))
		invalidatePartitionCache()
	}
	// An image listing deliberately leaves that set alone: another browser may
	// still be showing the shared folder, and clearing it would stop its
	// updates until the next listing.

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

	if !requireFileWrite(c, mediaType) {
		return
	}

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

	// exFAT folds case with its own table, so the name in the request is not
	// necessarily the file it replaces: check the on-disk spelling as well.
	if mediaType == proto.MediaTypePartition {
		touchesLibrary := utils.IsMediaFile(name)
		if !touchesLibrary {
			full, err := utils.CanonicalPathInside(mediaDirectory, target)
			if err != nil {
				respondError(c, err)
				return
			}
			touchesLibrary = utils.IsMediaFile(full)
		}
		if touchesLibrary && !requireLibraryWrite(c) {
			return
		}
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

		// The UI translates this one: refusing to overwrite is a normal answer
		// to an upload, not a failure whose English text needs to be shown.
		if errors.Is(err, diskfs.ErrExists) {
			rsp.ErrRsp(c, codeAlreadyExists, err.Error())
			return
		}

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
	if !requireFileWrite(c, req.Type) {
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

	// Our own transfer temporaries are not files to manage while a transfer
	// runs: deleting one its transfer is writing loses the data silently. One
	// found with no transfer running was left by an interrupted one, and the
	// user may clear it.
	if name := path.Base(entryPath); diskfs.IsTransferTemp(name) && TransferInProgress() {
		respondError(c, fmt.Errorf("%w: %s belongs to a running transfer", errMediumBusy, name))
		return
	}

	// A directory is removed with everything below it, the temporary of an
	// upload into it included.
	if target, ok := s.activeJobTarget(); ok && pathWithin(target, entryPath) {
		respondError(c, fmt.Errorf("%w: an upload into %s is running", errMediumBusy, entryPath))
		return
	}

	// Deleting through the shared partition has no loop mount to keep the
	// gadget away. Hold the operation lock until the unlink is done so a
	// concurrent mount cannot attach the file after the attachment check.
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	// A file the target machine is being served as its medium must not vanish
	// under it: the gadget keeps reading the inode it opened, so the target
	// machine would be left with a medium whose contents are already gone. An
	// image the file manager has mounted is just as much in use. A directory
	// is removed recursively, so the check covers everything below the path as
	// well. The path is resolved to its on-disk spelling first: exFAT folds
	// case, so "IMAGES" is the directory the attached "images/win.iso" is in.
	if req.Type == proto.MediaTypePartition {
		full, err := utils.CanonicalPathInside(mediaDirectory, entryPath)
		if err != nil {
			respondError(c, err)
			return
		}
		// Not knowing what the gadget serves is no reason to assume nothing.
		status, err := readDiskStatus()
		if err != nil {
			respondError(c, fmt.Errorf("refusing to delete %s: %w", entryPath, err))
			return
		}
		if err := deleteGuard(full, status.Backing, diskfs.MountedImages()); err != nil {
			respondError(c, err)
			return
		}
		touchesLibrary, err := holdsMedia(full)
		if err != nil {
			respondError(c, fmt.Errorf("refusing to delete %s: %w", entryPath, err))
			return
		}
		if touchesLibrary && !requireLibraryWrite(c) {
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

// MkdirMediaFile creates a directory inside a medium. The web file manager
// offers it next to the upload button: a folder the user can drop files into
// is how a disk that started empty becomes organised. It is a write like any
// other, so it goes through openMedium and is refused while the target machine
// owns the partition.
func (s *Service) MkdirMediaFile(c *gin.Context) {
	var req proto.MediaPathReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, codeInvalidArgument, "invalid arguments")
		return
	}
	if !requireFileWrite(c, req.Type) {
		return
	}

	entryPath, err := utils.ValidateMediumPath(req.Path)
	if err != nil {
		respondError(c, err)
		return
	}
	if entryPath == "/" {
		rsp.ErrRsp(c, codeInvalidArgument, "a directory path is required")
		return
	}

	image, err := openMedium(req.Type, req.Rel, true)
	if err != nil {
		respondError(c, err)
		return
	}
	defer closeMedia(image)

	if err := image.Mkdir(entryPath); err != nil {
		if errors.Is(err, diskfs.ErrExists) {
			if !req.ExistsOK {
				rsp.ErrRsp(c, codeAlreadyExists, fmt.Sprintf("%s already exists", entryPath))
				return
			}
		} else {
			respondError(c, fmt.Errorf("create %s: %w", entryPath, err))
			return
		}
	}

	// The shared partition has a metadata cache the listing reads; the
	// directory has to show up in the next list.
	if req.Type == proto.MediaTypePartition {
		invalidatePartitionCache()
	}

	rsp.OkRsp(c)
	log.Debugf("create directory %s in medium %s success", entryPath, req.Rel)
}

// maxWatchPaths caps the directories a single browser can ask the watcher to
// read every second. The file manager expands a handful at most.
const maxWatchPaths = 64

// watchPaths reads the directories the file browser is showing: the one being
// listed plus every folder it has expanded. Anything that does not name a
// directory inside the medium is dropped.
func watchPaths(listed string, raw string) []string {
	paths := []string{listed}
	seen := map[string]bool{listed: true}

	var candidates []string
	if raw = strings.TrimSpace(raw); raw != "" {
		if err := json.Unmarshal([]byte(raw), &candidates); err != nil {
			// An older client sent a comma separated list; a folder name may
			// contain a comma, which is exactly why JSON is used now.
			candidates = strings.Split(raw, ",")
		}
	}

	for _, candidate := range candidates {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			continue
		}

		cleaned, err := utils.ValidateMediumPath(candidate)
		if err != nil || seen[cleaned] {
			continue
		}

		seen[cleaned] = true
		paths = append(paths, cleaned)
		if len(paths) >= maxWatchPaths {
			break
		}
	}

	return paths
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
