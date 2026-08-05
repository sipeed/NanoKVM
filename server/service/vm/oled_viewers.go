package vm

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

const oledViewersFile = "/run/nanokvm/oled_viewers"

var (
	oledPublisherMu     sync.Mutex
	oledPublisherCancel context.CancelFunc
	oledPublisherDone   chan struct{}
)

func publishOLEDViewerCount(count int) error {
	if count < 0 {
		count = 0
	}
	if err := os.MkdirAll(filepath.Dir(oledViewersFile), 0o755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(oledViewersFile), ".oled_viewers-*")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)
	if err = tmp.Chmod(0o644); err == nil {
		_, err = fmt.Fprintf(tmp, "%d\n", count)
	}
	if err == nil {
		err = tmp.Sync()
	}
	if closeErr := tmp.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		return err
	}
	return os.Rename(tmpPath, oledViewersFile)
}

// StartOLEDViewerPublisher periodically publishes a heartbeat on tmpfs. The
// OLED process treats an absent or stale file as zero so either process can be
// upgraded or restarted independently.
func StartOLEDViewerPublisher() {
	oledPublisherMu.Lock()
	defer oledPublisherMu.Unlock()
	if oledPublisherCancel != nil {
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	oledPublisherCancel = cancel
	done := make(chan struct{})
	oledPublisherDone = done
	if err := publishOLEDViewerCount(OLEDViewerCount()); err != nil {
		log.Warnf("failed to publish OLED viewers: %s", err)
	}
	go func(done chan struct{}) {
		defer close(done)
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := publishOLEDViewerCount(OLEDViewerCount()); err != nil {
					log.Warnf("failed to publish OLED viewers: %s", err)
				}
			}
		}
	}(done)
}

func StopOLEDViewerPublisher() {
	oledPublisherMu.Lock()
	done := oledPublisherDone
	if oledPublisherCancel != nil {
		oledPublisherCancel()
		oledPublisherCancel = nil
		oledPublisherDone = nil
	}
	oledPublisherMu.Unlock()
	if done != nil {
		<-done
	}
	if err := os.Remove(oledViewersFile); err != nil && !os.IsNotExist(err) {
		log.Warnf("failed to remove OLED viewer state: %s", err)
	}
}
