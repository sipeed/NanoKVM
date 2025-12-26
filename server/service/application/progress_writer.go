package application

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	sentinelPath       = "/tmp/.download_in_progress"
	tickerInterval     = 2500 * time.Millisecond
	sentinelPermission = 0644
)

// progressWriter wraps an io.Writer to track and report upload progress.
type progressWriter struct {
	writer    io.Writer
	written   int64
	totalSize int64
	ticker    *time.Ticker
	done      chan struct{}
}

func newProgressWriter(w io.Writer, totalSize int64) *progressWriter {
	pw := &progressWriter{
		writer:    w,
		totalSize: totalSize,
		ticker:    time.NewTicker(tickerInterval),
		done:      make(chan struct{}),
	}

	go pw.reportProgress()
	return pw
}

func (pw *progressWriter) reportProgress() {
	for {
		select {
		case <-pw.done:
			return
		case <-pw.ticker.C:
			pw.updateSentinel()
		}
	}
}

func (pw *progressWriter) updateSentinel() {
	if pw.totalSize == 0 {
		return
	}

	content, err := os.ReadFile(sentinelPath)
	if err != nil {
		log.Error("Failed to read sentinel file")
		return
	}

	parts := strings.SplitN(string(content), ";", 2)
	if len(parts) == 0 {
		return
	}

	percentage := float64(pw.written) / float64(pw.totalSize) * 100
	newContent := fmt.Sprintf("%s;%.2f%%", parts[0], percentage)

	if err := os.WriteFile(sentinelPath, []byte(newContent), sentinelPermission); err != nil {
		log.Error("Failed to update sentinel file")
	}
}

func (pw *progressWriter) Write(p []byte) (int, error) {
	n, err := pw.writer.Write(p)
	pw.written += int64(n)
	return n, err
}

func (pw *progressWriter) Stop() {
	pw.ticker.Stop()
	close(pw.done)
}
