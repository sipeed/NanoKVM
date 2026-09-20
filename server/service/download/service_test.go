package download

import (
	"bytes"
	"path/filepath"
	"testing"
)

func headWithDescriptor(magic string) []byte {
	head := make([]byte, imageHeaderSize)
	copy(head[volumeDescriptorOffset:], magic)
	return head
}

func TestIsSupportedImage(t *testing.T) {
	mbr := make([]byte, imageHeaderSize)
	mbr[0x1FE], mbr[0x1FF] = 0x55, 0xAA

	gpt := make([]byte, imageHeaderSize)
	copy(gpt[0x200:], "EFI PART")

	apfs := make([]byte, imageHeaderSize)
	copy(apfs[0x20:], "NXSB")

	hfs := make([]byte, imageHeaderSize)
	copy(hfs[0x400:], "H+")

	tests := []struct {
		name string
		head []byte
		want bool
	}{
		{"iso9660 image", headWithDescriptor("CD001"), true},
		{"udf bridge image", headWithDescriptor("CD001"), true},
		{"udf only image", headWithDescriptor("BEA01"), true},
		{"gpt disk image", gpt, true},
		{"apfs disk image", apfs, true},
		{"hfs+ disk image", hfs, true},
		{"mbr disk image", mbr, true},
		{"compressed dmg", make([]byte, imageHeaderSize), false},
		{"plain data", bytes.Repeat([]byte{0xA5}, imageHeaderSize), false},
		{"truncated image", headWithDescriptor("CD001")[:16], false},
		{"empty image", nil, false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := isSupportedImage(test.head); got != test.want {
				t.Fatalf("isSupportedImage(%s) = %v, want %v", test.name, got, test.want)
			}
		})
	}
}

func TestEnsureImageSpace(t *testing.T) {
	dir := t.TempDir()

	if err := ensureImageSpace(dir, 0); err != nil {
		t.Fatalf("an upload without a known size must not be rejected: %v", err)
	}

	if err := ensureImageSpace(dir, 1<<20); err != nil {
		t.Fatalf("a small upload must fit: %v", err)
	}

	if err := ensureImageSpace(dir, 1<<62); err == nil {
		t.Fatal("an upload larger than the filesystem must be rejected")
	}

	if err := ensureImageSpace(filepath.Join(dir, "missing"), 1<<20); err == nil {
		t.Fatal("a missing directory must be rejected")
	}
}
