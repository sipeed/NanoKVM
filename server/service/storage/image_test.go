package storage

import (
	"os"
	"path/filepath"
	"testing"
)

func TestWriteMountTargetLeavesTheGadgetEmptyWhenUnmounting(t *testing.T) {
	// Unmounting clears the backing file first. Writing a fallback device
	// afterwards handed the target machine our raw eMMC partition, which has
	// no MBR -- Legacy BIOS then hangs instead of skipping the device.
	path := filepath.Join(t.TempDir(), "file")
	if err := os.WriteFile(path, []byte("\n"), 0o666); err != nil {
		t.Fatalf("setup: %s", err)
	}

	if err := writeMountTarget(path, ""); err != nil {
		t.Fatalf("expected unmounting to succeed: %s", err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("expected the backing file to be readable: %s", err)
	}

	if string(data) != "\n" {
		t.Fatalf("backing file became %q, want it left cleared", data)
	}
}

func TestWriteMountTargetMountsARealImage(t *testing.T) {
	path := filepath.Join(t.TempDir(), "file")

	if err := writeMountTarget(path, "/data/ubuntu.iso"); err != nil {
		t.Fatalf("expected mounting to succeed: %s", err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("expected the backing file to be readable: %s", err)
	}

	if string(data) != "/data/ubuntu.iso" {
		t.Fatalf("backing file is %q, want the image path", data)
	}
}

func TestNormalizeMountedImageReportsLegacyEmmcAsNoImage(t *testing.T) {
	// Devices that have not rebooted since the update still have the eMMC
	// path in the gadget, and the UI must not show it as a mounted image.
	if got := normalizeMountedImage("/dev/mmcblk0p3\n"); got != "" {
		t.Fatalf("normalizeMountedImage = %q, want empty", got)
	}
}

func TestNormalizeMountedImageKeepsARealImage(t *testing.T) {
	if got := normalizeMountedImage("/data/ubuntu.iso\n"); got != "/data/ubuntu.iso" {
		t.Fatalf("normalizeMountedImage = %q, want the image path", got)
	}
}
