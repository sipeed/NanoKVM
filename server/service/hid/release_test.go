package hid

import (
	"errors"
	"strings"
	"testing"
)

type releaseRecordingWriter struct {
	keyboardErr error
	relativeErr error
	absoluteErr error
	keyboard    int
	relative    int
	absolute    int
}

func (w *releaseRecordingWriter) WriteKeyboardReport([]byte) error {
	w.keyboard++
	return w.keyboardErr
}

func (w *releaseRecordingWriter) WriteRelativeMouseReport([]byte) error {
	w.relative++
	return w.relativeErr
}

func (w *releaseRecordingWriter) WriteAbsoluteMouseReport([]byte) error {
	w.absolute++
	return w.absoluteErr
}

func TestReleaseAllHIDStateAttemptsEveryDevice(t *testing.T) {
	writer := &releaseRecordingWriter{
		keyboardErr: errors.New("keyboard failed"),
		relativeErr: errors.New("relative failed"),
		absoluteErr: errors.New("absolute failed"),
	}

	err := releaseAllHIDState(writer)
	if err == nil {
		t.Fatal("expected joined release error")
	}
	if writer.keyboard != 1 || writer.relative != 1 || writer.absolute != 1 {
		t.Fatalf("release attempts keyboard=%d relative=%d absolute=%d", writer.keyboard, writer.relative, writer.absolute)
	}
	for _, message := range []string{"release keyboard", "release relative mouse", "release absolute mouse"} {
		if !strings.Contains(err.Error(), message) {
			t.Fatalf("error %q missing %q", err, message)
		}
	}
}

func TestReleaseAllHIDStateSuccess(t *testing.T) {
	writer := &releaseRecordingWriter{}
	if err := releaseAllHIDState(writer); err != nil {
		t.Fatal(err)
	}
	if writer.keyboard != 1 || writer.relative != 1 || writer.absolute != 1 {
		t.Fatalf("release attempts keyboard=%d relative=%d absolute=%d", writer.keyboard, writer.relative, writer.absolute)
	}
}

func TestReleaseAllHIDStateBestEffortSuppressesErrors(t *testing.T) {
	writer := &releaseRecordingWriter{
		keyboardErr: errors.New("keyboard failed"),
		relativeErr: errors.New("relative failed"),
		absoluteErr: errors.New("absolute failed"),
	}

	if err := releaseAllHIDStateBestEffort(writer); err != nil {
		t.Fatalf("best-effort release error = %v, want nil", err)
	}
	if writer.keyboard != 1 || writer.relative != 1 || writer.absolute != 1 {
		t.Fatalf("release attempts keyboard=%d relative=%d absolute=%d", writer.keyboard, writer.relative, writer.absolute)
	}
}
