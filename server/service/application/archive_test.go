package application

import (
	"archive/tar"
	"compress/gzip"
	"os"
	"path/filepath"
	"testing"
)

type archiveEntry struct {
	name     string
	typeFlag byte
	data     string
}

func writeTestArchive(t *testing.T, entries []archiveEntry) string {
	t.Helper()
	file := filepath.Join(t.TempDir(), "update.tar.gz")
	out, err := os.Create(file)
	if err != nil {
		t.Fatal(err)
	}
	gzipWriter := gzip.NewWriter(out)
	tarWriter := tar.NewWriter(gzipWriter)
	for _, entry := range entries {
		header := &tar.Header{Name: entry.name, Typeflag: entry.typeFlag, Mode: 0o755}
		if entry.typeFlag == tar.TypeReg || entry.typeFlag == tar.TypeRegA {
			header.Size = int64(len(entry.data))
		}
		if err := tarWriter.WriteHeader(header); err != nil {
			t.Fatal(err)
		}
		if entry.data != "" {
			if _, err := tarWriter.Write([]byte(entry.data)); err != nil {
				t.Fatal(err)
			}
		}
	}
	if err := tarWriter.Close(); err != nil {
		t.Fatal(err)
	}
	if err := gzipWriter.Close(); err != nil {
		t.Fatal(err)
	}
	if err := out.Close(); err != nil {
		t.Fatal(err)
	}
	return file
}

func TestInspectArchiveRejectsUnsafeEntries(t *testing.T) {
	root := "nanokvm_1.2.3"
	for _, entry := range []archiveEntry{
		{name: "../escape", typeFlag: tar.TypeReg, data: "x"},
		{name: "/escape", typeFlag: tar.TypeReg, data: "x"},
		{name: root + "/link", typeFlag: tar.TypeSymlink},
	} {
		archive := writeTestArchive(t, []archiveEntry{{name: root, typeFlag: tar.TypeDir}, entry})
		if _, err := inspectUpdateArchive(archive, root); err == nil {
			t.Fatalf("unsafe entry %+v was accepted", entry)
		}
	}
}

func TestInspectAndExtractArchive(t *testing.T) {
	root := "nanokvm_1.2.3"
	archive := writeTestArchive(t, []archiveEntry{
		{name: root, typeFlag: tar.TypeDir},
		{name: root + "/version", typeFlag: tar.TypeReg, data: "1.2.3\n"},
		{name: root + "/server/NanoKVM-Server", typeFlag: tar.TypeReg, data: "server"},
		{name: root + "/kvm_system/kvm_system", typeFlag: tar.TypeReg, data: "system"},
		{name: root + "/system/init.d/S95nanokvm", typeFlag: tar.TypeReg, data: "init"},
	})
	info, err := inspectUpdateArchive(archive, root)
	if err != nil {
		t.Fatal(err)
	}
	if info.expandedBytes != 22 { // data totals: 6 + 6 + 6 + 4
		t.Fatalf("unexpected expanded size %d", info.expandedBytes)
	}
	destination := t.TempDir()
	extracted, err := extractUpdateArchive(archive, destination, root)
	if err != nil {
		t.Fatal(err)
	}
	if err := validateExtractedPackage(extracted, "1.2.3"); err != nil {
		t.Fatal(err)
	}
}
