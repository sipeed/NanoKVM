package hid

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestMouseModeSwitchReleasesPreviousDevice(t *testing.T) {
	relativeReader, relativeWriter, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer relativeReader.Close()
	absoluteReader, absoluteWriter, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer absoluteReader.Close()

	h := &Hid{g1: relativeWriter, g2: absoluteWriter}
	queue := make(chan QueuedReport, 2)
	completed := make(chan bool, 2)
	absoluteReset := make(chan struct{}, 1)
	absoluteDown := []byte{1, 0x34, 0x12, 0x78, 0x56, 0}
	queue <- QueuedReport{
		Data:     absoluteDown,
		Complete: func(success bool) { completed <- success },
		ResetAbsoluteMouse: func() {
			absoluteReset <- struct{}{}
		},
	}
	queue <- QueuedReport{
		Data:               relativeMouseReleaseReport(),
		Complete:           func(success bool) { completed <- success },
		ResetAbsoluteMouse: func() { absoluteReset <- struct{}{} },
	}
	close(queue)

	done := make(chan struct{})
	go func() {
		h.mouseReports(queue, "unused-relative", "unused-absolute")
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("mouse worker did not stop")
	}

	for range 2 {
		select {
		case success := <-completed:
			if !success {
				t.Fatal("mouse report failed")
			}
		default:
			t.Fatal("missing mouse completion")
		}
	}
	select {
	case <-absoluteReset:
	default:
		t.Fatal("absolute state was not reset during mode switch")
	}

	absoluteData := make([]byte, 12)
	if _, err := io.ReadFull(absoluteReader, absoluteData); err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(absoluteData[:6], absoluteDown) {
		t.Fatalf("absolute down report = %v", absoluteData[:6])
	}
	wantRelease := absoluteMouseReleaseReport(absoluteDown)
	if !bytes.Equal(absoluteData[6:], wantRelease) {
		t.Fatalf("absolute release report = %v, want %v", absoluteData[6:], wantRelease)
	}
	relativeData := make([]byte, 4)
	if _, err := io.ReadFull(relativeReader, relativeData); err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(relativeData, relativeMouseReleaseReport()) {
		t.Fatalf("relative report = %v", relativeData)
	}
	h.Close()
}

func TestKeyboardFailureCompletesAfterCleanup(t *testing.T) {
	path := filepath.Join(t.TempDir(), "hidg0")
	closedFile, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		t.Fatal(err)
	}
	if err := closedFile.Close(); err != nil {
		t.Fatal(err)
	}

	h := &Hid{g0: closedFile}
	queue := make(chan QueuedReport, 1)
	cleanupStarted := make(chan struct{})
	allowCleanup := make(chan struct{})
	cleanupFinished := make(chan struct{})
	completed := make(chan bool, 1)
	executions := 0
	queue <- QueuedReport{
		Data: []byte{0, 0, 4, 0, 0, 0, 0, 0},
		Execute: func(write func() error) error {
			executions++
			if executions == 2 {
				close(cleanupStarted)
				<-allowCleanup
			}
			err := write()
			if executions == 2 {
				close(cleanupFinished)
			}
			return err
		},
		Complete: func(success bool) { completed <- success },
	}
	close(queue)

	done := make(chan struct{})
	go func() {
		h.keyboardReports(queue, path)
		close(done)
	}()

	select {
	case <-cleanupStarted:
	case <-time.After(time.Second):
		t.Fatal("cleanup did not start")
	}
	select {
	case success := <-completed:
		t.Fatalf("reservation completed before cleanup: success=%v", success)
	default:
	}

	close(allowCleanup)
	select {
	case <-cleanupFinished:
	case <-time.After(time.Second):
		t.Fatal("cleanup did not finish")
	}
	select {
	case success := <-completed:
		if success {
			t.Fatal("failed write completed successfully")
		}
	case <-time.After(time.Second):
		t.Fatal("reservation was not completed")
	}
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("keyboard worker did not stop")
	}
	h.Close()
}

func TestKeyboardFailureCompletesFalseWhenCleanupFails(t *testing.T) {
	path := filepath.Join(t.TempDir(), "hidg0")
	closedFile, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		t.Fatal(err)
	}
	if err := closedFile.Close(); err != nil {
		t.Fatal(err)
	}

	h := &Hid{g0: closedFile}
	queue := make(chan QueuedReport, 1)
	completed := make(chan bool, 1)
	queue <- QueuedReport{
		Data:     []byte{0, 0, 4, 0, 0, 0, 0, 0},
		Complete: func(success bool) { completed <- success },
	}
	close(queue)

	done := make(chan struct{})
	go func() {
		h.keyboardReports(queue, filepath.Join(t.TempDir(), "missing", "hidg0"))
		close(done)
	}()

	select {
	case success := <-completed:
		if success {
			t.Fatal("failed keyboard write completed successfully after cleanup failed")
		}
	case <-time.After(time.Second):
		t.Fatal("reservation was not completed")
	}
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("keyboard worker did not stop")
	}
	h.Close()
}

func TestMouseFailureCompletesFalseWhenCleanupFails(t *testing.T) {
	path := filepath.Join(t.TempDir(), "hidg1")
	closedFile, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		t.Fatal(err)
	}
	if err := closedFile.Close(); err != nil {
		t.Fatal(err)
	}

	h := &Hid{g1: closedFile}
	queue := make(chan QueuedReport, 1)
	completed := make(chan bool, 1)
	queue <- QueuedReport{
		Data:     []byte{1, 0, 0, 0},
		Complete: func(success bool) { completed <- success },
	}
	close(queue)

	done := make(chan struct{})
	go func() {
		h.mouseReports(queue, filepath.Join(t.TempDir(), "missing", "hidg1"), filepath.Join(t.TempDir(), "hidg2"))
		close(done)
	}()

	select {
	case success := <-completed:
		if success {
			t.Fatal("failed mouse write completed successfully after cleanup failed")
		}
	case <-time.After(time.Second):
		t.Fatal("reservation was not completed")
	}
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("mouse worker did not stop")
	}
	h.Close()
}
