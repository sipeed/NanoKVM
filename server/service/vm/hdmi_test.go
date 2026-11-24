package vm

import (
	"testing"

	"NanoKVM-Server/hardware/lontium"
)

func TestReadLeaseUsesCSIFromMatchingSequence(t *testing.T) {
	oldRead, oldCapture := readHdmiStatus, getHdmiCapture
	oldDisabled, oldTimeout := isHdmiDisabled, getHdmiIdleTimeout
	t.Cleanup(func() {
		readHdmiStatus, getHdmiCapture = oldRead, oldCapture
		isHdmiDisabled, getHdmiIdleTimeout = oldDisabled, oldTimeout
	})
	isHdmiDisabled = func() bool { return false }
	getHdmiIdleTimeout = func() int { return 0 }

	sizes := []lontium.Size{
		{Valid: true, Width: 1280, Height: 720},
		{Valid: true, Width: 1920, Height: 1080},
	}
	reads := 0
	readHdmiStatus = func() (lontium.Status, error) {
		if reads >= len(sizes) {
			t.Fatal("unexpected receiver read after the matching snapshot")
		}
		size := sizes[reads]
		reads++
		return lontium.Status{
			Sequence: uint64(reads), Power: "on", Signal: lontium.Valid,
			Input: lontium.Size{Valid: true, Width: 3840, Height: 2160},
			CSI:   lontium.CSITiming{Size: size},
		}, nil
	}
	getHdmiCapture = func() (int, uint64, error) { return 0, 2, nil }

	lease, err := AcquireHdmiCaptureLeaseForRead(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	defer lease.Release()
	if reads != 2 || lease.Width != 1920 || lease.Height != 1080 {
		t.Fatalf("receiver reads=%d lease=%dx%d, want 2 reads and 1920x1080", reads, lease.Width, lease.Height)
	}
}
