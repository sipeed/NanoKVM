package mcpservice

import (
	"context"
	"errors"
	"testing"
)

type recordingHID struct {
	keyboard [][]byte
	relative [][]byte
	absolute [][]byte
	failAt   int
	writes   int
	onWrite  func(int)
}

func (h *recordingHID) record(target *[][]byte, report []byte) error {
	h.writes++
	if h.onWrite != nil {
		h.onWrite(h.writes)
	}
	*target = append(*target, append([]byte(nil), report...))
	if h.failAt > 0 && h.writes == h.failAt {
		return errors.New("write failed")
	}
	return nil
}

func (h *recordingHID) WriteKeyboardReport(report []byte) error {
	return h.record(&h.keyboard, report)
}

func (h *recordingHID) WriteRelativeMouseReport(report []byte) error {
	return h.record(&h.relative, report)
}

func (h *recordingHID) WriteAbsoluteMouseReport(report []byte) error {
	return h.record(&h.absolute, report)
}

func TestRemotePressKeysAlwaysReleases(t *testing.T) {
	hid := &recordingHID{}
	remote := newRemoteWithHID(hid)
	if err := remote.PressKeys(context.Background(), []string{"ShiftLeft", "KeyA"}, 0); err != nil {
		t.Fatal(err)
	}
	if len(hid.keyboard) != 2 || string(hid.keyboard[1]) != string(keyUpReport) {
		t.Fatalf("keyboard reports: %v", hid.keyboard)
	}

	failing := &recordingHID{failAt: 1}
	if err := newRemoteWithHID(failing).PressKeys(context.Background(), []string{"KeyA"}, 0); err == nil {
		t.Fatal("expected write error")
	}
	if len(failing.keyboard) != 2 || string(failing.keyboard[1]) != string(keyUpReport) {
		t.Fatalf("release not attempted after error: %v", failing.keyboard)
	}
}

func TestRemoteClickReleasesButton(t *testing.T) {
	hid := &recordingHID{}
	if err := newRemoteWithHID(hid).Click(context.Background(), "left", 1, 0); err != nil {
		t.Fatal(err)
	}
	if len(hid.relative) != 2 || hid.relative[0][0] != 1 || hid.relative[1][0] != 0 {
		t.Fatalf("relative reports: %v", hid.relative)
	}
}

func TestRemoteScrollUsesAbsoluteReportsAndReleasesWheel(t *testing.T) {
	hid := &recordingHID{}
	if err := newRemoteWithHID(hid).Scroll(context.Background(), 130); err != nil {
		t.Fatal(err)
	}

	if len(hid.relative) != 0 {
		t.Fatalf("relative reports = %v, want none", hid.relative)
	}
	if len(hid.absolute) != 4 {
		t.Fatalf("absolute report count = %d, want 4: %v", len(hid.absolute), hid.absolute)
	}

	x := absoluteCoordinate(0.5)
	y := absoluteCoordinate(0.5)
	want := [][]byte{
		buildAbsolutePointerReport(x, y, 0, 127),
		buildAbsolutePointerReport(x, y, 0, 0),
		buildAbsolutePointerReport(x, y, 0, 3),
		buildAbsolutePointerReport(x, y, 0, 0),
	}
	for i := range want {
		if string(hid.absolute[i]) != string(want[i]) {
			t.Fatalf("absolute[%d] = %v, want %v", i, hid.absolute[i], want[i])
		}
	}
}

func TestRemoteTypeTextCancellationReleasesKeyboard(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	hid := &recordingHID{}
	hid.onWrite = func(write int) {
		if write == 1 {
			cancel()
		}
	}

	_, err := newRemoteWithHID(hid).TypeText(ctx, "A", 0)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("error = %v, want canceled", err)
	}
	if len(hid.keyboard) != 2 || string(hid.keyboard[1]) != string(keyUpReport) {
		t.Fatalf("keyboard was not released after cancellation: %v", hid.keyboard)
	}
}
