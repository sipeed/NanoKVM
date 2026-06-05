package hid

import (
	"errors"
	"os"
	"runtime"
	"syscall"
	"testing"
)

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
