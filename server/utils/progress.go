package utils

import (
	"fmt"
	"io"
	"sync"
	"sync/atomic"
	"time"
)

// progressInterval matches the polling cadence of the web UI, so a transfer
// never reports a percentage the client has already stopped asking for.
const progressInterval = 2500 * time.Millisecond

// ProgressWriter counts the bytes written through it and reports progress to
// onProgress on a fixed ticker. Transfers that take minutes (image downloads
// and uploads, media creation) use it to feed the status endpoints the web UI
// polls.
type ProgressWriter struct {
	writer     io.Writer
	total      atomic.Int64
	totalSize  int64
	ticker     *time.Ticker
	done       chan struct{}
	stopOnce   sync.Once
	onProgress func(loaded, total int64)
}

// NewProgressWriter wraps writer. totalSize is the expected number of bytes;
// when it is unknown (a chunked response, for example) no progress is
// reported. onProgress receives the bytes written so far and the total.
func NewProgressWriter(writer io.Writer, totalSize int64, onProgress func(loaded, total int64)) *ProgressWriter {
	pw := &ProgressWriter{
		writer:     writer,
		totalSize:  totalSize,
		onProgress: onProgress,
	}
	pw.startTicker()
	return pw
}

func (pw *ProgressWriter) startTicker() {
	pw.ticker = time.NewTicker(progressInterval)
	pw.done = make(chan struct{})
	go func() {
		for {
			select {
			case <-pw.done:
				return
			case <-pw.ticker.C:
				pw.updateProgress()
			}
		}
	}()
}

// Stop halts the ticker. It is safe to call more than once and on a nil
// writer, so callers can defer it unconditionally.
func (pw *ProgressWriter) Stop() {
	if pw == nil {
		return
	}
	pw.stopOnce.Do(func() {
		pw.ticker.Stop()
		close(pw.done)
	})
}

func (pw *ProgressWriter) updateProgress() {
	if pw.totalSize <= 0 || pw.onProgress == nil {
		return
	}

	pw.onProgress(pw.total.Load(), pw.totalSize)
}

// FormatPercentage renders transfer progress the way the status endpoints
// report it: values like "42.13%", and an empty string before the first tick
// or when the total size is unknown.
func FormatPercentage(loaded, total int64) string {
	if loaded <= 0 || total <= 0 {
		return ""
	}
	return fmt.Sprintf("%.2f%%", float64(loaded)/float64(total)*100)
}

func (pw *ProgressWriter) Write(p []byte) (int, error) {
	n, err := pw.writer.Write(p)
	pw.total.Add(int64(n))
	return n, err
}
