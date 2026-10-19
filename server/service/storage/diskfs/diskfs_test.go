package diskfs

import (
	"io"
	"os"
	"path/filepath"
	"testing"
)

func writeImage(t *testing.T, descriptors ...string) string {
	t.Helper()
	image := make([]byte, 0x8000+(len(descriptors)+2)*opticalSectorSize)
	for i, id := range descriptors {
		copy(image[0x8000+i*opticalSectorSize+1:], id)
	}
	path := filepath.Join(t.TempDir(), "disc.iso")
	if err := os.WriteFile(path, image, 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestDetectOptical(t *testing.T) {
	tests := []struct {
		name        string
		descriptors []string
		want        Kind
	}{
		{"iso9660", []string{"CD001", "CD001"}, KindISO9660},
		{"iso9660 with udf bridge", []string{"CD001", "BEA01", "NSR02", "TEA01"}, KindISO9660},
		{"pure udf 1.02", []string{"BEA01", "NSR02", "TEA01"}, KindUDF},
		{"pure udf 2.x", []string{"BEA01", "NSR03", "TEA01"}, KindUDF},
		{"extended area without nsr", []string{"BEA01", "TEA01"}, KindUnknown},
		{"nothing", nil, KindUnknown},
		{"nsr after a gap", []string{"BEA01", "", "NSR03"}, KindUnknown},
	}

	for _, tt := range tests {
		kind, err := Detect(writeImage(t, tt.descriptors...))
		if err != nil {
			t.Errorf("%s: %v", tt.name, err)
			continue
		}
		if kind != tt.want {
			t.Errorf("%s: Detect = %q, want %q", tt.name, kind, tt.want)
		}
		if kind.Optical() != (tt.want == KindISO9660 || tt.want == KindUDF) {
			t.Errorf("%s: Optical = %v", tt.name, kind.Optical())
		}
	}
}

func TestIsTransferTemp(t *testing.T) {
	tests := map[string]bool{
		".kvm-upload-0a1b2c3d":         true,
		".kvm-upload-00000000":         true,
		".kvm-upload-0A1B2C3D":         false,
		".kvm-upload-0a1b2c3":          false,
		".kvm-upload-notes.txt":        false,
		".nanokvm-upload-123456789":    true,
		".nanokvm-download-4294967295": true,
		".nanokvm-download-":           false,
		".nanokvm-config":              false,
		".nanokvm-upload-12ab":         false,
		"ubuntu.iso":                   false,
	}
	for name, want := range tests {
		if got := IsTransferTemp(name); got != want {
			t.Errorf("IsTransferTemp(%q) = %v, want %v", name, got, want)
		}
	}
}

func TestListDirHidesTransferTemps(t *testing.T) {
	root := t.TempDir()
	for _, name := range []string{"a.txt", ".kvm-upload-0a1b2c3d", ".nanokvm-download-42", ".nanokvm-mine"} {
		if err := os.WriteFile(filepath.Join(root, name), nil, 0o644); err != nil {
			t.Fatal(err)
		}
	}

	entries, err := listDir(root, "/")
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, entry := range entries {
		names = append(names, entry.Name)
	}
	if len(names) != 2 || names[0] != ".nanokvm-mine" || names[1] != "a.txt" {
		t.Errorf("listDir = %v, want [.nanokvm-mine a.txt]", names)
	}
}

func TestOpenFileRefusesSymlinks(t *testing.T) {
	outside := filepath.Join(t.TempDir(), "secret")
	if err := os.WriteFile(outside, []byte("secret"), 0o600); err != nil {
		t.Fatal(err)
	}

	root := t.TempDir()
	if err := os.Symlink(outside, filepath.Join(root, "link")); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(root, "dir"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "file"), []byte("ok"), 0o644); err != nil {
		t.Fatal(err)
	}

	if file, _, err := openFile(root, "link"); err == nil {
		_ = file.Close()
		t.Error("openFile followed a symlink")
	}
	if file, _, err := openFile(root, "dir"); err == nil {
		_ = file.Close()
		t.Error("openFile opened a directory")
	}

	file, entry, err := openFile(root, "file")
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	data, _ := io.ReadAll(file)
	if string(data) != "ok" || entry.Size != 2 {
		t.Errorf("openFile read %q, size %d", data, entry.Size)
	}
}
