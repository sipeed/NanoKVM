package download

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/storage"
	"NanoKVM-Server/service/storage/diskfs"
	"NanoKVM-Server/utils"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"golang.org/x/sys/unix"
)

type downloadStatus string

const (
	transferSentinelPath                        = utils.TransferSentinelPath
	downloadStatusIdle           downloadStatus = "idle"
	downloadStatusInProgress     downloadStatus = "in_progress"
	downloadStatusSuccess        downloadStatus = "success"
	downloadStatusFailed         downloadStatus = "failed"
	downloadStatusChecksumFailed downloadStatus = "checksum_failed"

	imageDirectory = "/data"

	// transferTempPrefix marks the partial files of the uploads and downloads
	// this service writes. The file manager hides and refuses them (its own
	// downloadTempPrefix in service/storage), and a restart sweeps whatever a
	// transfer left behind.
	transferTempPrefix = ".nanokvm-"

	// Keep /data from filling up completely: the exFAT metadata and the USB
	// mass-storage export still need room while the image is written.
	imageFreeReserve = 128 << 20
)

var (
	errDownloadInProgress = errors.New("download in progress")
	errSHA256Mismatch     = errors.New("sha256 mismatch")
)

// maxUploadBytes caps a single upload even when the client lies about its
// length, so a runaway request cannot fill the card before the free space
// check has had its say.
const maxUploadBytes = 8 << 30

type Service struct {
	downloadMutex  sync.Mutex
	downloadCancel context.CancelFunc
	downloadDone   chan struct{}
	downloadStatus downloadStatus
	downloadFile   string
	downloadLoaded int64
	downloadTotal  int64
}

func NewService() *Service {
	// A running transfer cannot survive a server restart, so any remaining lock
	// file is stale at this point.
	_ = os.Remove(transferSentinelPath)
	removeStaleTransfers()

	return &Service{downloadStatus: downloadStatusIdle}
}

// removeStaleTransfers deletes the temporary files of uploads and downloads
// that a restart interrupted. They are hidden and can be hundreds of
// megabytes, so leaving them behind would quietly fill the card - and the
// file manager refuses to delete them itself, because it cannot tell a stale
// one from one a running transfer owns. A file upload into the shared folder
// writes its temporary next to its target, so the whole tree is walked, not
// just the root.
func removeStaleTransfers() {
	_ = filepath.Walk(imageDirectory, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}

		if !strings.HasPrefix(info.Name(), transferTempPrefix) &&
			!strings.HasPrefix(info.Name(), diskfs.UploadPrefix) {
			return nil
		}

		if err := os.Remove(path); err != nil {
			log.Errorf("remove stale transfer %s failed: %s", path, err)
		} else {
			log.Infof("removed stale transfer %s", path)
		}
		return nil
	})
}

func (s *Service) CancelDownloadImage(c *gin.Context) {
	var rsp proto.Response

	s.downloadMutex.Lock()
	cancel := s.downloadCancel
	done := s.downloadDone
	s.downloadMutex.Unlock()

	if cancel == nil || done == nil {
		rsp.ErrRsp(c, -1, "no cancellable download in progress")
		return
	}

	cancel()
	select {
	case <-done:
		rsp.OkRsp(c)
	case <-time.After(10 * time.Second):
		rsp.ErrRsp(c, -1, "cancel download timed out")
	}
}

func (s *Service) beginDownload(file string, cancel context.CancelFunc) (chan struct{}, error) {
	s.downloadMutex.Lock()
	defer s.downloadMutex.Unlock()

	if s.downloadDone != nil {
		return nil, errDownloadInProgress
	}

	lockFile, err := os.OpenFile(
		transferSentinelPath,
		os.O_WRONLY|os.O_CREATE|os.O_EXCL,
		0o644,
	)
	if err != nil {
		if os.IsExist(err) {
			return nil, errDownloadInProgress
		}
		return nil, fmt.Errorf("acquire transfer lock failed: %w", err)
	}
	if err := lockFile.Close(); err != nil {
		_ = os.Remove(transferSentinelPath)
		return nil, fmt.Errorf("close transfer lock failed: %w", err)
	}

	done := make(chan struct{})
	s.downloadCancel = cancel
	s.downloadDone = done
	s.downloadStatus = downloadStatusInProgress
	s.downloadFile = file
	s.downloadLoaded = 0
	s.downloadTotal = 0

	return done, nil
}

func (s *Service) setDownloadFile(done chan struct{}, file string) {
	s.downloadMutex.Lock()
	defer s.downloadMutex.Unlock()

	if s.downloadDone == done {
		s.downloadFile = file
	}
}

func (s *Service) setDownloadProgress(done chan struct{}, loaded, total int64) {
	s.downloadMutex.Lock()
	defer s.downloadMutex.Unlock()

	if s.downloadDone == done {
		s.downloadLoaded = loaded
		s.downloadTotal = total
	}
}

func (s *Service) finishDownload(done chan struct{}, status downloadStatus) {
	s.downloadMutex.Lock()
	if s.downloadDone != done {
		s.downloadMutex.Unlock()
		return
	}

	s.downloadCancel = nil
	s.downloadDone = nil
	s.downloadStatus = status
	s.downloadFile = ""
	s.downloadLoaded = 0
	s.downloadTotal = 0
	_ = os.Remove(transferSentinelPath)
	s.downloadMutex.Unlock()

	close(done)
}

func (s *Service) ImageEnabled(c *gin.Context) {
	var rsp proto.Response

	testFile := "/data/.testfile"
	file, err := os.Create(testFile)
	if err != nil {
		rsp.OkRspWithData(c, &proto.ImageEnabledRsp{Enabled: false})
		return
	}
	defer file.Close()
	defer os.Remove(testFile)

	rsp.OkRspWithData(c, &proto.ImageEnabledRsp{Enabled: true})
}

// ensureImageSpace rejects an upload that cannot fit into dir, keeping a small
// reserve for filesystem metadata and for the USB mass-storage export.
func ensureImageSpace(dir string, contentLength int64) error {
	if contentLength <= 0 {
		return nil
	}

	var stat unix.Statfs_t
	if err := unix.Statfs(dir, &stat); err != nil {
		return fmt.Errorf("cannot read free space of %s: %w", dir, err)
	}

	available := uint64(stat.Bavail) * uint64(stat.Bsize)
	payload := uint64(contentLength)
	if payload > available || available-payload < imageFreeReserve {
		return fmt.Errorf(
			"not enough space in %s: need %d MiB including reserve, %d MiB available",
			dir,
			(payload+imageFreeReserve)>>20,
			available>>20,
		)
	}

	return nil
}

func (s *Service) StatusImage(c *gin.Context) {
	var rsp proto.Response

	s.downloadMutex.Lock()
	status := s.downloadStatus
	file := s.downloadFile
	loaded := s.downloadLoaded
	total := s.downloadTotal
	s.downloadMutex.Unlock()

	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     string(status),
		File:       file,
		Percentage: utils.FormatPercentage(loaded, total),
		Loaded:     loaded,
		Total:      total,
	})
}

func (s *Service) DownloadImageFile(c *gin.Context) {
	var rsp proto.Response

	log.Debug("DownloadImageFile")

	// Everything below lands on the data partition, which the target machine
	// owns whenever the emulated disk is attached to it. Hold that ownership
	// decision for the whole transfer: a mount must wait instead of remounting
	// /data underneath an upload that is already streaming.
	releaseDataPartitionWrite, err := storage.BeginDataPartitionWrite()
	if err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	defer releaseDataPartitionWrite()

	expectedSHA256, err := parseSHA256(c.GetHeader("X-SHA256-Sum"))
	if err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}

	// Reject an upload that cannot fit before any of it is received.
	if err := ensureImageSpace(imageDirectory, c.Request.ContentLength); err != nil {
		log.Warnf("reject image upload: %s", err)
		rsp.ErrRsp(c, -1, err.Error())
		return
	}

	done, err := s.beginDownload("", nil)
	if err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	finalStatus := downloadStatusFailed
	defer func() {
		s.finishDownload(done, finalStatus)
	}()

	// The whole body is written to the data partition, so cap the request even
	// when the client lies about its length. This has to happen before the
	// multipart reader is created: it keeps reading from the body it was handed.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadBytes)

	reader, err := c.Request.MultipartReader()
	if err != nil {
		log.Error("invalid multipart data")
		rsp.ErrRsp(c, -1, "invalid multipart data")
		return
	}

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Error("failed to read part")
			rsp.ErrRsp(c, -1, "failed to read part")
			return
		}
		if part.FormName() != "file" {
			_ = part.Close()
			continue
		}

		filename := part.FileName()
		if err := validateImageFilename(filename); err != nil {
			_ = part.Close()
			log.Warnf("reject uploaded image %q: %s", filename, err)
			rsp.ErrRsp(c, -1, err.Error())
			return
		}
		s.setDownloadFile(done, filename)

		// The rejection paths below return without draining the request body: the
		// client stops uploading as soon as the response arrives.
		out, err := os.CreateTemp(imageDirectory, transferTempPrefix+"upload-*")
		if err != nil {
			log.Errorf("cannot create temporary file in %s: %s", imageDirectory, err)
			rsp.ErrRsp(c, -1, "cannot create temporary file")
			return
		}
		tempPath := out.Name()
		defer os.Remove(tempPath)

		hasher := sha256.New()
		lw := utils.NewProgressWriter(io.MultiWriter(out, hasher), c.Request.ContentLength, func(loaded, total int64) {
			s.setDownloadProgress(done, loaded, total)
		})
		// The name already said what this has to be: .iso or .img. The bytes
		// are taken as they come; a file that turns out not to be an image
		// fails when it is mounted, not while it is stored.
		_, copyErr := io.Copy(lw, part)
		lw.Stop()
		partCloseErr := part.Close()
		outCloseErr := out.Close()
		if copyErr != nil || partCloseErr != nil || outCloseErr != nil {
			log.Errorf("write uploaded image %q failed: %s", filename, errors.Join(copyErr, partCloseErr, outCloseErr))
			rsp.ErrRsp(c, -1, "write failed")
			return
		}

		if expectedSHA256 != nil && !bytes.Equal(hasher.Sum(nil), expectedSHA256) {
			finalStatus = downloadStatusChecksumFailed
			rsp.ErrRsp(c, -1, errSHA256Mismatch.Error())
			return
		}

		outPath := filepath.Join(imageDirectory, filename)
		if err := storage.InstallImage(tempPath, outPath); err != nil {
			rsp.ErrRsp(c, -1, err.Error())
			return
		}

		finalStatus = downloadStatusIdle
		rsp.OkRspWithData(c, &proto.StatusImageRsp{
			Status:     string(downloadStatusIdle),
			File:       "",
			Percentage: "",
		})
		return
	}

	rsp.ErrRsp(c, -1, "file is required")
}

// validateImageFilename accepts what the emulated disk can expose: ISO images
// and raw disk images. The name never reaches the filesystem unchecked, and
// the rules are the ones a FAT volume can hold, so a medium named the same way
// is reachable from the file manager too.
func validateImageFilename(filename string) error {
	if !utils.IsMediaFile(filename) {
		return errors.New("only .iso and .img files allowed")
	}
	return utils.ValidateFileName(filename)
}

func (s *Service) DownloadImage(c *gin.Context) {
	var req proto.DownloadImageReq
	var rsp proto.Response

	log.Debug("DownloadImage")

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	expectedSHA256, err := parseSHA256(req.SHA256Sum)
	if err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}

	u, err := url.Parse(req.File)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.Path == "" {
		rsp.ErrRsp(c, -1, "invalid url")
		return
	}
	filename := filepath.Base(u.Path)
	if filename == "." || filename == "/" || filename == "" {
		rsp.ErrRsp(c, -1, "invalid url")
		return
	}

	// The download runs after this handler returns, and its temporary file is
	// on the same partition the raw medium exposes. Keep the partition reserved
	// until the goroutine has installed or removed that file.
	releaseDataPartitionWrite, err := storage.BeginDataPartitionWrite()
	if err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	done, err := s.beginDownload(req.File, cancel)
	if err != nil {
		releaseDataPartitionWrite()
		cancel()
		rsp.ErrRsp(c, -1, err.Error())
		return
	}

	go func() {
		defer releaseDataPartitionWrite()
		defer cancel()

		if err := s.downloadRemoteImage(ctx, req.File, expectedSHA256, filename, func(loaded, total int64) {
			s.setDownloadProgress(done, loaded, total)
		}); err != nil {
			if errors.Is(err, context.Canceled) {
				log.Debug("Image download canceled")
				s.finishDownload(done, downloadStatusIdle)
				return
			}

			log.Errorf("Failed to download image: %v", err)
			status := downloadStatusFailed
			if errors.Is(err, errSHA256Mismatch) {
				status = downloadStatusChecksumFailed
			}
			s.finishDownload(done, status)
			return
		}
		s.finishDownload(done, downloadStatusSuccess)
	}()

	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     string(downloadStatusInProgress),
		File:       req.File,
		Percentage: "",
	})
}

func parseSHA256(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}

	sum, err := hex.DecodeString(value)
	if err != nil || len(sum) != sha256.Size {
		return nil, errors.New("invalid sha256sum")
	}

	return sum, nil
}

func (s *Service) downloadRemoteImage(
	ctx context.Context,
	rawURL string,
	expectedSHA256 []byte,
	filename string,
	onProgress func(loaded, total int64),
) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return fmt.Errorf("create download request failed: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("download request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download request returned status %d", resp.StatusCode)
	}

	// The response headers say how large the image is: refuse it now instead
	// of filling the partition and failing at the end. An unknown length
	// (chunked responses) skips the check and is caught by the write itself.
	if err := ensureImageSpace(imageDirectory, resp.ContentLength); err != nil {
		return err
	}

	tempFile, err := os.CreateTemp(imageDirectory, transferTempPrefix+"download-*")
	if err != nil {
		return fmt.Errorf("create temporary image failed: %w", err)
	}
	tempPath := tempFile.Name()
	defer os.Remove(tempPath)

	hasher := sha256.New()
	lw := utils.NewProgressWriter(io.MultiWriter(tempFile, hasher), resp.ContentLength, onProgress)
	_, copyErr := io.Copy(lw, resp.Body)
	lw.Stop()
	closeErr := tempFile.Close()
	if ctx.Err() != nil {
		return ctx.Err()
	}
	if copyErr != nil {
		return fmt.Errorf("save downloaded image failed: %w", copyErr)
	}
	if closeErr != nil {
		return fmt.Errorf("close downloaded image failed: %w", closeErr)
	}

	if expectedSHA256 != nil && !bytes.Equal(hasher.Sum(nil), expectedSHA256) {
		return errSHA256Mismatch
	}
	if ctx.Err() != nil {
		return ctx.Err()
	}

	destPath := filepath.Join(imageDirectory, filename)
	if err := storage.InstallImage(tempPath, destPath); err != nil {
		return err
	}

	return nil
}
