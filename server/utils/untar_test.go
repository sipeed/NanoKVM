package utils

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

type tarEntry struct {
	name     string
	typeflag byte
	linkname string
	content  string
}

func writeTarGz(t *testing.T, entries []tarEntry) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "package.tar.gz")
	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("failed to create archive: %s", err)
	}
	defer f.Close()

	gw := gzip.NewWriter(f)
	tw := tar.NewWriter(gw)

	for _, entry := range entries {
		header := &tar.Header{
			Name:     entry.name,
			Typeflag: entry.typeflag,
			Linkname: entry.linkname,
			Mode:     0o644,
			Size:     int64(len(entry.content)),
		}
		if entry.typeflag != tar.TypeReg {
			header.Size = 0
		}
		if err := tw.WriteHeader(header); err != nil {
			t.Fatalf("failed to write header: %s", err)
		}
		if entry.typeflag == tar.TypeReg {
			if _, err := tw.Write([]byte(entry.content)); err != nil {
				t.Fatalf("failed to write body: %s", err)
			}
		}
	}

	if err := tw.Close(); err != nil {
		t.Fatalf("failed to close tar: %s", err)
	}
	if err := gw.Close(); err != nil {
		t.Fatalf("failed to close gzip: %s", err)
	}

	return path
}

func TestUnTarGzExtractsNormalArchive(t *testing.T) {
	archive := writeTarGz(t, []tarEntry{
		{name: "app/", typeflag: tar.TypeDir},
		{name: "app/version", typeflag: tar.TypeReg, content: "2.0.0"},
	})
	dest := t.TempDir()

	dir, err := UnTarGz(archive, dest)
	if err != nil {
		t.Fatalf("a well-formed archive should extract: %s", err)
	}
	if dir != filepath.Join(dest, "app") {
		t.Fatalf("unexpected target dir %q", dir)
	}

	content, err := os.ReadFile(filepath.Join(dest, "app", "version"))
	if err != nil || string(content) != "2.0.0" {
		t.Fatalf("expected extracted file, got %q err %v", content, err)
	}
}

func TestUnTarGzRejectsPathTraversal(t *testing.T) {
	outside := filepath.Join(t.TempDir(), "outside")
	if err := os.MkdirAll(outside, 0o755); err != nil {
		t.Fatalf("failed to create outside dir: %s", err)
	}
	dest := filepath.Join(outside, "dest")
	if err := os.MkdirAll(dest, 0o755); err != nil {
		t.Fatalf("failed to create dest dir: %s", err)
	}

	archive := writeTarGz(t, []tarEntry{
		{name: "../pwned", typeflag: tar.TypeReg, content: "owned"},
	})

	if _, err := UnTarGz(archive, dest); !errors.Is(err, ErrUnsafeArchiveEntry) {
		t.Fatalf("an entry escaping the destination must be rejected, got %v", err)
	}

	if _, err := os.Stat(filepath.Join(outside, "pwned")); err == nil {
		t.Fatal("a file was written outside the destination directory")
	}
}

func TestUnTarGzRejectsAbsolutePath(t *testing.T) {
	archive := writeTarGz(t, []tarEntry{
		{name: "/etc/kvm/pwned", typeflag: tar.TypeReg, content: "owned"},
	})

	if _, err := UnTarGz(archive, t.TempDir()); !errors.Is(err, ErrUnsafeArchiveEntry) {
		t.Fatalf("an absolute entry name must be rejected, got %v", err)
	}
}

func TestUnTarGzRejectsSymlink(t *testing.T) {
	// A symlink entry lets a later entry write through it to any path on the
	// device, so links are not extracted at all.
	archive := writeTarGz(t, []tarEntry{
		{name: "app/link", typeflag: tar.TypeSymlink, linkname: "/etc/kvm"},
	})
	dest := t.TempDir()

	if _, err := UnTarGz(archive, dest); !errors.Is(err, ErrUnsafeArchiveEntry) {
		t.Fatalf("a symlink entry must be rejected, got %v", err)
	}

	if _, err := os.Lstat(filepath.Join(dest, "app", "link")); err == nil {
		t.Fatal("a symlink was created")
	}
}

func TestUnTarGzRejectsHardLink(t *testing.T) {
	archive := writeTarGz(t, []tarEntry{
		{name: "app/link", typeflag: tar.TypeLink, linkname: "/etc/kvm/pwd"},
	})

	if _, err := UnTarGz(archive, t.TempDir()); !errors.Is(err, ErrUnsafeArchiveEntry) {
		t.Fatalf("a hard link entry must be rejected, got %v", err)
	}
}
