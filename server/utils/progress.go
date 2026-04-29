package utils

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	ProgressStatusPath       = "/tmp/.download_in_progress"
	ProgressStatusPermission = 0o644
	progressTickerInterval   = 2500 * time.Millisecond
)

var validFlatFilenameRegex = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

type ProgressWriter struct {
	writer     io.Writer
	written    int64
	totalSize  int64
	statusPath string
	ticker     *time.Ticker
	done       chan struct{}
	stopOnce   sync.Once
}

type ProgressStatus struct {
	File       string
	Percentage string
}

func NewProgressWriter(w io.Writer, totalSize int64, statusPath string) *ProgressWriter {
	pw := &ProgressWriter{
		writer:     w,
		totalSize:  totalSize,
		statusPath: statusPath,
		ticker:     time.NewTicker(progressTickerInterval),
		done:       make(chan struct{}),
	}

	go pw.reportProgress()
	return pw
}

func (pw *ProgressWriter) reportProgress() {
	for {
		select {
		case <-pw.done:
			return
		case <-pw.ticker.C:
			pw.updateStatus()
		}
	}
}

func (pw *ProgressWriter) updateStatus() {
	if pw.totalSize <= 0 {
		return
	}

	content, err := os.ReadFile(pw.statusPath)
	if err != nil {
		log.Error("Failed to read sentinel file")
		return
	}

	status := ParseProgressStatus(string(content))
	percentage := float64(pw.written) / float64(pw.totalSize) * 100
	newContent := fmt.Sprintf("%s;%.2f%%", status.File, percentage)

	if err := os.WriteFile(pw.statusPath, []byte(newContent), ProgressStatusPermission); err != nil {
		log.Error("Failed to update sentinel file")
	}
}

func (pw *ProgressWriter) Write(p []byte) (int, error) {
	n, err := pw.writer.Write(p)
	pw.written += int64(n)
	return n, err
}

func (pw *ProgressWriter) Stop() {
	pw.stopOnce.Do(func() {
		pw.ticker.Stop()
		close(pw.done)
	})
}

func ProgressStatusExists() bool {
	_, err := os.Stat(ProgressStatusPath)
	return err == nil
}

func ReadProgressStatus() (string, error) {
	content, err := os.ReadFile(ProgressStatusPath)
	return string(content), err
}

func ParseProgressStatus(content string) ProgressStatus {
	parts := strings.SplitN(content, ";", 2)
	status := ProgressStatus{File: parts[0]}
	if len(parts) > 1 {
		status.Percentage = parts[1]
	}
	return status
}

func WriteProgressStatus(content string) error {
	return os.WriteFile(ProgressStatusPath, []byte(content), ProgressStatusPermission)
}

func ClearProgressStatus() {
	_ = os.Remove(ProgressStatusPath)
}

func ValidateFlatFilename(filename string) error {
	baseName := filepath.Base(filename)
	if baseName != filename {
		log.Warnf("Path detected in filename: %s", filename)
		return fmt.Errorf("path detected in filename")
	}

	if strings.Contains(filename, "..") {
		log.Warnf("Path traversal attempt: %s", filename)
		return fmt.Errorf("invalid filename: path traversal detected")
	}

	if !validFlatFilenameRegex.MatchString(filename) {
		log.Warnf("Invalid filename characters: %s", filename)
		return fmt.Errorf("invalid filename: contains invalid characters")
	}

	return nil
}
