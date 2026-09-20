package netbird

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestVerifyArchiveDigest(t *testing.T) {
	archive := filepath.Join(t.TempDir(), "asset.tgz")
	contents := []byte("trusted release asset")
	if err := os.WriteFile(archive, contents, 0o600); err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256(contents)
	expected := fmt.Sprintf("%x", digest[:])
	if err := verifyArchiveDigest(archive, expected); err != nil {
		t.Fatalf("verifyArchiveDigest: %v", err)
	}
	if err := verifyArchiveDigest(archive, strings.Repeat("0", 64)); err == nil {
		t.Fatal("verifyArchiveDigest accepted a mismatched digest")
	}
}

func TestVersionsMatchRequiresAValidPinnedVersion(t *testing.T) {
	for _, test := range []struct {
		name      string
		pinned    string
		installed string
		want      bool
	}{
		{name: "matching release", pinned: "0.77.1", installed: "0.77.1", want: true},
		{name: "different release", pinned: "0.77.1", installed: "0.77.2"},
		{name: "missing marker", pinned: "", installed: ""},
		{name: "matching corrupt markers", pinned: "not-a-version", installed: "not-a-version"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := versionsMatch(test.pinned, test.installed); got != test.want {
				t.Fatalf("versionsMatch(%q, %q) = %t, want %t", test.pinned, test.installed, got, test.want)
			}
		})
	}
}

func TestCanStartAtBootRequiresUsableFilesAndAnAttestedInstall(t *testing.T) {
	directory := t.TempDir()
	binaryPath := filepath.Join(directory, "netbird")
	scriptPath := filepath.Join(directory, "S99netbird")

	if err := os.WriteFile(binaryPath, []byte("binary"), 0o755); err != nil {
		t.Fatal(err)
	}
	// S95 copies this source file and chmods its /etc/init.d copy, so the
	// recovery script itself need not carry an execute bit.
	if err := os.WriteFile(scriptPath, []byte("script"), 0o644); err != nil {
		t.Fatal(err)
	}

	for _, test := range []struct {
		name      string
		binary    string
		script    string
		installed string
		want      bool
	}{
		{name: "eligible", binary: binaryPath, script: scriptPath, installed: "0.77.1", want: true},
		// A release older than the firmware pin is still one this installer
		// published. Booting it is what keeps a NetBird-only device reachable
		// across a firmware update.
		{name: "release older than the pin", binary: binaryPath, script: scriptPath, installed: "0.76.0", want: true},
		{name: "missing marker", binary: binaryPath, script: scriptPath, installed: ""},
		{name: "corrupt marker", binary: binaryPath, script: scriptPath, installed: "not-a-version"},
		{name: "missing binary", binary: filepath.Join(directory, "missing"), script: scriptPath, installed: "0.77.1"},
		{name: "missing script", binary: binaryPath, script: filepath.Join(directory, "missing-script"), installed: "0.77.1"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := canStartAtBoot(test.binary, test.script, test.installed); got != test.want {
				t.Fatalf("canStartAtBoot() = %t, want %t", got, test.want)
			}
		})
	}
}

func TestInstallAttestedAcceptsAnyWellFormedMarker(t *testing.T) {
	for _, test := range []struct {
		name      string
		installed string
		want      bool
	}{
		{name: "pinned release", installed: "0.77.1", want: true},
		{name: "older release", installed: "0.76.0", want: true},
		{name: "missing marker", installed: ""},
		{name: "corrupt marker", installed: "not-a-version"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := installAttested(test.installed); got != test.want {
				t.Fatalf("installAttested(%q) = %t, want %t", test.installed, got, test.want)
			}
		})
	}
}

type archiveEntry struct {
	name     string
	typeflag byte
	linkname string
	data     []byte
}

func TestValidateAndExtractArchive(t *testing.T) {
	const version = "0.77.1"
	root := "netbird_" + version + "_riscv64"
	validEntries := []archiveEntry{
		{name: root, typeflag: tar.TypeDir},
		{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
		{name: root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
	}

	tests := []struct {
		name    string
		entries []archiveEntry
		wantErr bool
	}{
		{name: "valid release asset", entries: validEntries},
		{
			// GNU tar writes the root directory with this spelling in the real
			// release asset built by scripts/build-netbird.sh.
			name: "valid release asset with GNU root directory spelling",
			entries: []archiveEntry{
				{name: root + "/", typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
				{name: root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
			},
		},
		{
			name: "both root directory spellings are duplicate",
			entries: []archiveEntry{
				{name: root, typeflag: tar.TypeDir},
				{name: root + "/", typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
				{name: root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
			},
			wantErr: true,
		},
		{
			name: "root double slash is rejected",
			entries: []archiveEntry{
				{name: root + "//", typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
				{name: root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
			},
			wantErr: true,
		},
		{
			name: "path traversal",
			entries: []archiveEntry{
				{name: root, typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
				{name: "../" + root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
			},
			wantErr: true,
		},
		{
			name: "symlink instead of binary",
			entries: []archiveEntry{
				{name: root, typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
				{name: root + "/netbird", typeflag: tar.TypeSymlink, linkname: "/bin/sh"},
			},
			wantErr: true,
		},
		{
			name:    "extra payload",
			entries: append(append([]archiveEntry{}, validEntries...), archiveEntry{name: root + "/extra", typeflag: tar.TypeReg, data: []byte("x")}),
			wantErr: true,
		},
		{
			name:    "duplicate entry",
			entries: append(append([]archiveEntry{}, validEntries...), archiveEntry{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")}),
			wantErr: true,
		},
		{
			name: "mismatched version",
			entries: []archiveEntry{
				{name: root, typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte("0.77.2\n")},
				{name: root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
			},
			wantErr: true,
		},
		{
			name: "wrong ELF architecture",
			entries: []archiveEntry{
				{name: root, typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
				{name: root + "/netbird", typeflag: tar.TypeReg, data: []byte("not an ELF")},
			},
			wantErr: true,
		},
		{
			name: "oversized version",
			entries: []archiveEntry{
				{name: root, typeflag: tar.TypeDir},
				{name: root + "/VERSION", typeflag: tar.TypeReg, data: make([]byte, maxNetbirdVersionSize+1)},
				{name: root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
			},
			wantErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			workspace := t.TempDir()
			archivePath := filepath.Join(t.TempDir(), "netbird_riscv64.tgz")
			writeTestArchive(t, archivePath, test.entries)

			dir, gotVersion, err := validateAndExtractArchive(archivePath, workspace, version)
			if test.wantErr {
				if err == nil {
					t.Fatal("validateAndExtractArchive() succeeded unexpectedly")
				}
				entries, readErr := os.ReadDir(workspace)
				if readErr != nil {
					t.Fatalf("ReadDir(workspace): %v", readErr)
				}
				if len(entries) != 0 {
					t.Fatalf("invalid archive left extracted files: %v", entries)
				}
				return
			}
			if err != nil {
				t.Fatalf("validateAndExtractArchive(): %v", err)
			}
			if gotVersion != version {
				t.Fatalf("version = %q, want %q", gotVersion, version)
			}
			info, err := os.Lstat(filepath.Join(dir, "netbird"))
			if err != nil {
				t.Fatalf("Lstat extracted binary: %v", err)
			}
			if !info.Mode().IsRegular() {
				t.Fatalf("extracted binary mode = %v, want regular file", info.Mode())
			}
		})
	}
}

func TestValidateAndExtractArchiveRejectsInvalidPinnedVersion(t *testing.T) {
	archivePath := filepath.Join(t.TempDir(), "netbird_riscv64.tgz")
	writeTestArchive(t, archivePath, nil)

	if _, _, err := validateAndExtractArchive(archivePath, t.TempDir(), "not-a-version"); err == nil {
		t.Fatal("validateAndExtractArchive() accepted invalid pinned version")
	}
}

func TestValidateAndExtractArchiveRejectsCorruptGzip(t *testing.T) {
	const version = "0.77.1"
	root := "netbird_" + version + "_riscv64"
	archivePath := filepath.Join(t.TempDir(), "netbird_riscv64.tgz")
	writeTestArchive(t, archivePath, []archiveEntry{
		{name: root, typeflag: tar.TypeDir},
		{name: root + "/VERSION", typeflag: tar.TypeReg, data: []byte(version + "\n")},
		{name: root + "/netbird", typeflag: tar.TypeReg, data: riscvELFHeader()},
	})

	content, err := os.ReadFile(archivePath)
	if err != nil {
		t.Fatalf("ReadFile archive: %v", err)
	}
	content[len(content)-1] ^= 0xff // corrupt gzip's ISIZE field
	if err := os.WriteFile(archivePath, content, 0o600); err != nil {
		t.Fatalf("WriteFile corrupt archive: %v", err)
	}

	if _, _, err := validateAndExtractArchive(archivePath, t.TempDir(), version); err == nil {
		t.Fatal("validateAndExtractArchive() accepted corrupt gzip stream")
	}
}

func TestStagedInstallPromoteAndCleanup(t *testing.T) {
	const version = "0.77.1"
	staged := makeStagedInstall(t, version)
	binaryPath := filepath.Join(t.TempDir(), "usr", "bin", "netbird")
	versionPath := filepath.Join(t.TempDir(), "etc", "kvm", "netbird.version")

	if err := staged.promote(binaryPath, versionPath); err != nil {
		t.Fatalf("promote(): %v", err)
	}
	info, err := os.Lstat(binaryPath)
	if err != nil {
		t.Fatalf("Lstat promoted binary: %v", err)
	}
	if !info.Mode().IsRegular() || info.Mode().Perm() != 0o755 {
		t.Fatalf("promoted binary mode = %v, want regular 0755", info.Mode())
	}
	versionContent, err := os.ReadFile(versionPath)
	if err != nil {
		t.Fatalf("ReadFile installed version: %v", err)
	}
	if string(versionContent) != version+"\n" {
		t.Fatalf("installed version = %q, want %q", versionContent, version+"\n")
	}
	if err := staged.Cleanup(); err != nil {
		t.Fatalf("Cleanup(): %v", err)
	}
	if _, err := os.Stat(binaryPath); err != nil {
		t.Fatalf("Cleanup removed promoted binary: %v", err)
	}
}

func TestStagedInstallPromoteRefusesReplacement(t *testing.T) {
	staged := makeStagedInstall(t, "0.77.1")
	binaryPath := filepath.Join(t.TempDir(), "netbird")
	versionPath := filepath.Join(t.TempDir(), "netbird.version")
	if err := os.WriteFile(binaryPath, []byte("existing"), 0o755); err != nil {
		t.Fatalf("WriteFile existing binary: %v", err)
	}
	if err := os.WriteFile(versionPath, []byte("0.0.1\n"), 0o644); err != nil {
		t.Fatalf("WriteFile existing marker: %v", err)
	}

	err := staged.promote(binaryPath, versionPath)
	if !errors.Is(err, ErrNetbirdAlreadyInstalled) {
		t.Fatalf("promote() error = %v, want ErrNetbirdAlreadyInstalled", err)
	}
	content, err := os.ReadFile(binaryPath)
	if err != nil {
		t.Fatalf("ReadFile existing binary: %v", err)
	}
	if string(content) != "existing" {
		t.Fatalf("promote replaced existing binary with %q", content)
	}
	marker, err := os.ReadFile(versionPath)
	if err != nil {
		t.Fatalf("ReadFile existing marker: %v", err)
	}
	if string(marker) != "0.0.1\n" {
		t.Fatalf("promote replaced marker before collision check: %q", marker)
	}
}

func TestStagedInstallPromoteRollsBackWhenVersionWriteFails(t *testing.T) {
	staged := makeStagedInstall(t, "0.77.1")
	binaryPath := filepath.Join(t.TempDir(), "netbird")
	blocker := filepath.Join(t.TempDir(), "not-a-directory")
	if err := os.WriteFile(blocker, []byte("block"), 0o600); err != nil {
		t.Fatalf("WriteFile blocker: %v", err)
	}

	if err := staged.promote(binaryPath, filepath.Join(blocker, "netbird.version")); err == nil {
		t.Fatal("promote() succeeded with an unwritable version path")
	}
	if _, err := os.Lstat(binaryPath); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("promote left binary after metadata failure: %v", err)
	}
	if _, err := os.Lstat(filepath.Join(staged.dir, "netbird")); err != nil {
		t.Fatalf("promote lost staged binary after metadata failure: %v", err)
	}
}

func makeStagedInstall(t *testing.T, version string) *StagedInstall {
	t.Helper()

	workspace := t.TempDir()
	dir := filepath.Join(workspace, "netbird_"+version+"_riscv64")
	if err := os.Mkdir(dir, 0o755); err != nil {
		t.Fatalf("Mkdir staged dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dir, "VERSION"), []byte(version+"\n"), 0o600); err != nil {
		t.Fatalf("WriteFile staged version: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dir, "netbird"), riscvELFHeader(), 0o600); err != nil {
		t.Fatalf("WriteFile staged binary: %v", err)
	}
	return &StagedInstall{workspace: workspace, dir: dir, version: version}
}

func writeTestArchive(t *testing.T, path string, entries []archiveEntry) {
	t.Helper()

	file, err := os.Create(path)
	if err != nil {
		t.Fatalf("Create archive: %v", err)
	}
	gz := gzip.NewWriter(file)
	tw := tar.NewWriter(gz)
	for _, entry := range entries {
		header := &tar.Header{
			Name:     entry.name,
			Typeflag: entry.typeflag,
			Linkname: entry.linkname,
			Mode:     0o644,
			Size:     int64(len(entry.data)),
		}
		if entry.typeflag == tar.TypeDir {
			header.Mode = 0o755
			header.Size = 0
		}
		if err := tw.WriteHeader(header); err != nil {
			t.Fatalf("WriteHeader(%q): %v", entry.name, err)
		}
		if _, err := tw.Write(entry.data); err != nil {
			t.Fatalf("Write(%q): %v", entry.name, err)
		}
	}
	if err := tw.Close(); err != nil {
		t.Fatalf("close tar: %v", err)
	}
	if err := gz.Close(); err != nil {
		t.Fatalf("close gzip: %v", err)
	}
	if err := file.Close(); err != nil {
		t.Fatalf("close archive: %v", err)
	}
}

func riscvELFHeader() []byte {
	header := make([]byte, 64)
	copy(header, "\x7fELF")
	header[4] = 2 // ELFCLASS64
	header[5] = 1 // ELFDATA2LSB
	header[6] = 1 // EV_CURRENT
	header[18] = 243
	header[20] = 1  // e_version = EV_CURRENT
	header[52] = 64 // e_ehsize
	return header
}
