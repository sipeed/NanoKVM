package hid

import (
	"errors"
	"os"
	"runtime"
	"syscall"
	"testing"
	"time"
)

func TestReportLengthValidation(t *testing.T) {
	h := &Hid{}
	if err := h.WriteKeyboardReport(make([]byte, 7)); err == nil {
		t.Fatal("expected keyboard length error")
	}
	if err := h.WriteRelativeMouseReport(make([]byte, 5)); err == nil {
		t.Fatal("expected relative mouse length error")
	}
	if err := h.WriteAbsoluteMouseReport(make([]byte, 7)); err == nil {
		t.Fatal("expected absolute mouse length error")
	}
}

func TestPasteDurationLeavesModeSwitchMargin(t *testing.T) {
	if maxPasteDuration >= 30*time.Second {
		t.Fatalf("maxPasteDuration = %s, want below 30s mode switch wait budget", maxPasteDuration)
	}
	if got := time.Duration(maxPasteContentRunes) * defaultPasteDelay; got > maxPasteDuration {
		t.Fatalf("max paste content duration = %s, want <= %s", got, maxPasteDuration)
	}
}

func TestHidFileWasDeleted(t *testing.T) {
	if runtime.GOOS != "linux" {
		t.Skip("deleted fd detection uses /proc/self/fd")
	}

	file, err := os.CreateTemp(t.TempDir(), "hidg")
	if err != nil {
		t.Fatal(err)
	}
	if hidFileWasDeleted(file) {
		t.Fatal("new file reported as deleted")
	}

	if err := os.Remove(file.Name()); err != nil {
		t.Fatal(err)
	}
	if !hidFileWasDeleted(file) {
		t.Fatal("unlinked open file did not report as deleted")
	}
}

func TestIsStaleHIDWriteError(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{name: "closed", err: os.ErrClosed, want: true},
		{name: "io", err: syscall.EIO, want: true},
		{name: "no device", err: syscall.ENODEV, want: true},
		{name: "no such device address", err: syscall.ENXIO, want: true},
		{name: "pipe", err: syscall.EPIPE, want: true},
		{name: "shutdown", err: syscall.ESHUTDOWN, want: true},
		{name: "wrapped", err: errors.Join(syscall.EIO), want: true},
		{name: "again", err: syscall.EAGAIN, want: false},
		{name: "deadline", err: os.ErrDeadlineExceeded, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isStaleHIDWriteError(tt.err); got != tt.want {
				t.Fatalf("isStaleHIDWriteError(%v) = %v, want %v", tt.err, got, tt.want)
			}
		})
	}
}
func TestCloseDeviceForWriteClosesKeyboardHandles(t *testing.T) {
	writer, err := os.CreateTemp(t.TempDir(), "hid-writer")
	if err != nil {
		t.Fatal(err)
	}
	reader, err := os.Open(writer.Name())
	if err != nil {
		t.Fatal(err)
	}

	h := &Hid{g0: writer, g0Reader: reader}
	h.closeDeviceForWriteNoLock(h.keyboardDevice(HID0))
	if h.g0 != nil || h.g0Reader != nil {
		t.Fatalf("keyboard handles remain open: writer=%v reader=%v", h.g0, h.g0Reader)
	}
}
