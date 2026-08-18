package storage

import "testing"

func TestIsMountableImageAcceptsImagesInDataDirectory(t *testing.T) {
	for _, path := range []string{"/data/ubuntu.iso", "/data/win.IMG", "/data/isos/debian.iso"} {
		if !isMountableImage(path) {
			t.Fatalf("%q should be mountable", path)
		}
	}
}

func TestIsMountableImageRejectsBlockDevices(t *testing.T) {
	// Mounting a raw device exposes the whole filesystem of the KVM to the
	// machine it is plugged into.
	for _, path := range []string{"/dev/mmcblk0", "/dev/mmcblk0p3", "/etc/shadow"} {
		if isMountableImage(path) {
			t.Fatalf("%q must not be mountable", path)
		}
	}
}

func TestIsMountableImageRejectsTraversal(t *testing.T) {
	if isMountableImage("/data/../etc/shadow.iso") {
		t.Fatal("a traversal out of the image directory must be rejected")
	}
}

func TestIsMountableImageRejectsOtherExtensions(t *testing.T) {
	for _, path := range []string{"/data/notes.txt", "/data/script.sh", "/data/iso"} {
		if isMountableImage(path) {
			t.Fatalf("%q must not be mountable", path)
		}
	}
}

func TestIsMountableImageRejectsEmptyPath(t *testing.T) {
	if isMountableImage("") {
		t.Fatal("an empty path is not a mountable image")
	}
}
