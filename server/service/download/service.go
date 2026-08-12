package download

import (
	"NanoKVM-Server/proto"
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
	"regexp"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type downloadStatus string

const (
	transferSentinelPath                        = utils.TransferSentinelPath
	downloadStatusIdle           downloadStatus = "idle"
	downloadStatusInProgress     downloadStatus = "in_progress"
	downloadStatusSuccess        downloadStatus = "success"
	downloadStatusFailed         downloadStatus = "failed"
	downloadStatusChecksumFailed downloadStatus = "checksum_failed"
)

var (
	errDownloadInProgress = errors.New("download in progress")
	errSHA256Mismatch     = errors.New("sha256 mismatch")
	validISOFilename      = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)
)

type Service struct {
	downloadMutex      sync.Mutex
	downloadCancel     context.CancelFunc
	downloadDone       chan struct{}
	downloadStatus     downloadStatus
	downloadFile       string
	downloadPercentage string
}

func NewService() *Service {
	// A running transfer cannot survive a server restart, so any remaining lock
	// file is stale at this point.
	_ = os.Remove(transferSentinelPath)
	return &Service{downloadStatus: downloadStatusIdle}
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
	s.downloadPercentage = ""

	return done, nil
}

func (s *Service) setDownloadFile(done chan struct{}, file string) {
	s.downloadMutex.Lock()
	defer s.downloadMutex.Unlock()

	if s.downloadDone == done {
		s.downloadFile = file
	}
}

func (s *Service) setDownloadProgress(done chan struct{}, percentage string) {
	s.downloadMutex.Lock()
	defer s.downloadMutex.Unlock()

	if s.downloadDone == done {
		s.downloadPercentage = percentage
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
	s.downloadPercentage = ""
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

func isISO9660(path string) (bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer f.Close()

	// ISO-9660 magic "CD001" at offset 32769.
	if _, err = f.Seek(0x8001, io.SeekStart); err != nil {
		return false, err
	}

	buf := make([]byte, 5)
	if _, err = io.ReadFull(f, buf); err != nil {
		return false, err
	}

	return string(buf) == "CD001", nil
}

func (s *Service) StatusImage(c *gin.Context) {
	var rsp proto.Response

	s.downloadMutex.Lock()
	status := s.downloadStatus
	file := s.downloadFile
	percentage := s.downloadPercentage
	s.downloadMutex.Unlock()

	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     string(status),
		File:       file,
		Percentage: percentage,
	})
}

func (s *Service) DownloadImageFile(c *gin.Context) {
	var rsp proto.Response

	log.Debug("DownloadImageFile")
	expectedSHA256, err := parseSHA256(c.GetHeader("X-SHA256-Sum"))
	if err != nil {
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
		if err := validateISOFilename(filename); err != nil {
			_ = part.Close()
			rsp.ErrRsp(c, -1, err.Error())
			return
		}
		s.setDownloadFile(done, filename)

		out, err := os.CreateTemp("/data", ".nanokvm-upload-*")
		if err != nil {
			_ = part.Close()
			log.Error("cannot create temporary file")
			rsp.ErrRsp(c, -1, "cannot create temporary file")
			return
		}
		tempPath := out.Name()
		defer os.Remove(tempPath)

		hasher := sha256.New()
		lw := newLoggingWriter(io.MultiWriter(out, hasher), c.Request.ContentLength, func(percentage string) {
			s.setDownloadProgress(done, percentage)
		})
		_, copyErr := io.Copy(lw, part)
		lw.stopTicker()
		partCloseErr := part.Close()
		outCloseErr := out.Close()
		if copyErr != nil || partCloseErr != nil || outCloseErr != nil {
			log.Error("write failed")
			rsp.ErrRsp(c, -1, "write failed")
			return
		}

		if expectedSHA256 != nil && !bytes.Equal(hasher.Sum(nil), expectedSHA256) {
			finalStatus = downloadStatusChecksumFailed
			rsp.ErrRsp(c, -1, errSHA256Mismatch.Error())
			return
		}

		valid, err := isISO9660(tempPath)
		if err != nil || !valid {
			rsp.ErrRsp(c, -1, "file is not a valid ISO image")
			return
		}

		outPath := filepath.Join("/data", filename)
		if err := os.Rename(tempPath, outPath); err != nil {
			rsp.ErrRsp(c, -1, "cannot install uploaded image")
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

func validateISOFilename(filename string) error {
	if filename == "" {
		return errors.New("no filename")
	}
	if filepath.Base(filename) != filename || strings.Contains(filename, "..") {
		return errors.New("invalid filename")
	}
	if !strings.HasSuffix(strings.ToLower(filename), ".iso") {
		return errors.New("only .iso files allowed")
	}
	if !validISOFilename.MatchString(filename) {
		return errors.New("invalid filename")
	}
	return nil
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

	ctx, cancel := context.WithCancel(context.Background())
	done, err := s.beginDownload(req.File, cancel)
	if err != nil {
		cancel()
		rsp.ErrRsp(c, -1, err.Error())
		return
	}

	go func() {
		defer cancel()

		if err := s.downloadRemoteImage(ctx, req.File, expectedSHA256, filename, func(percentage string) {
			s.setDownloadProgress(done, percentage)
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
	onProgress func(string),
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

	tempFile, err := os.CreateTemp("/data", ".nanokvm-download-*")
	if err != nil {
		return fmt.Errorf("create temporary image failed: %w", err)
	}
	tempPath := tempFile.Name()
	defer os.Remove(tempPath)

	hasher := sha256.New()
	lw := newLoggingWriter(io.MultiWriter(tempFile, hasher), resp.ContentLength, onProgress)
	_, copyErr := io.Copy(lw, resp.Body)
	lw.stopTicker()
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

	destPath := filepath.Join("/data", filename)
	if err := os.Rename(tempPath, destPath); err != nil {
		return fmt.Errorf("install downloaded image failed: %w", err)
	}

	return nil
}

type loggingWriter struct {
	writer     io.Writer
	total      atomic.Int64
	totalSize  int64
	ticker     *time.Ticker
	done       chan struct{}
	stopOnce   sync.Once
	onProgress func(string)
}

func newLoggingWriter(writer io.Writer, totalSize int64, onProgress func(string)) *loggingWriter {
	lw := &loggingWriter{
		writer:     writer,
		totalSize:  totalSize,
		onProgress: onProgress,
	}
	lw.startTicker()
	return lw
}

func (lw *loggingWriter) startTicker() {
	lw.ticker = time.NewTicker(2500 * time.Millisecond)
	lw.done = make(chan struct{})
	go func() {
		for {
			select {
			case <-lw.done:
				return
			case <-lw.ticker.C:
				lw.updateProgress()
			}
		}
	}()
}

func (lw *loggingWriter) stopTicker() {
	if lw == nil {
		return
	}
	lw.stopOnce.Do(func() {
		lw.ticker.Stop()
		close(lw.done)
	})
}

func (lw *loggingWriter) updateProgress() {
	if lw.totalSize <= 0 || lw.onProgress == nil {
		return
	}

	percentage := float64(lw.total.Load()) / float64(lw.totalSize) * 100
	lw.onProgress(fmt.Sprintf("%.2f%%", percentage))
}

func (lw *loggingWriter) Write(p []byte) (int, error) {
	n, err := lw.writer.Write(p)
	lw.total.Add(int64(n))
	return n, err
}
