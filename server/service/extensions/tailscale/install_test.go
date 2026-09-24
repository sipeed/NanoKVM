package tailscale

import (
	"NanoKVM-Server/service/extensions/vpnpref"
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const testTailscaleVersion = "1.90.0"

func requiredTailscaleArchiveEntries() []string {
	return []string{
		"tailscale",
		"tailscaled",
		"systemd",
		"systemd/tailscaled.service",
		"systemd/tailscaled.defaults",
		"systemd/tailscale-online.target",
		"systemd/tailscale-wait-online.service",
	}
}

func testArchive(t *testing.T, entries []string) []byte {
	t.Helper()
	return testArchiveWithOverrides(t, entries, nil, nil)
}

func testArchiveWithOverrides(t *testing.T, entries []string, dataOverrides map[string][]byte, typeOverrides map[string]byte) []byte {
	t.Helper()
	var output bytes.Buffer
	gz := gzip.NewWriter(&output)
	tarball := tar.NewWriter(gz)
	root := "tailscale_" + testTailscaleVersion + "_riscv64"
	if err := tarball.WriteHeader(&tar.Header{Name: root + "/", Mode: 0o755, Typeflag: tar.TypeDir}); err != nil {
		t.Fatal(err)
	}
	for _, name := range entries {
		typeflag := byte(tar.TypeReg)
		if name == "systemd" {
			typeflag = byte(tar.TypeDir)
		}
		if override, ok := typeOverrides[name]; ok {
			typeflag = override
		}
		data := []byte("unit-file-" + name)
		if name == "tailscale" || name == "tailscaled" {
			data = riscvELFHeader()
		}
		if override, ok := dataOverrides[name]; ok {
			data = override
		}
		entryName := root + "/" + name
		// The official archive uses GNU tar's trailing-slash spelling for both
		// directories, so keep the fixture faithful to the pinned artifact.
		if typeflag == tar.TypeDir {
			entryName += "/"
		}
		header := &tar.Header{Name: entryName, Mode: 0o755, Typeflag: typeflag}
		if typeflag == tar.TypeDir {
			header.Size = 0
		} else {
			header.Size = int64(len(data))
		}
		if typeflag == tar.TypeSymlink {
			header.Linkname = "/bin/sh"
			header.Size = 0
		}
		if err := tarball.WriteHeader(header); err != nil {
			t.Fatal(err)
		}
		if typeflag != tar.TypeDir && typeflag != tar.TypeSymlink {
			if _, err := tarball.Write(data); err != nil {
				t.Fatal(err)
			}
		}
	}
	if err := tarball.Close(); err != nil {
		t.Fatal(err)
	}
	if err := gz.Close(); err != nil {
		t.Fatal(err)
	}
	return output.Bytes()
}

func riscvELFHeader() []byte {
	header := make([]byte, 64)
	copy(header, "\x7fELF")
	header[4] = 2  // ELFCLASS64
	header[5] = 1  // ELFDATA2LSB
	header[6] = 1  // EV_CURRENT
	header[16] = 2 // ET_EXEC
	header[18] = 243
	header[20] = 1  // e_version = EV_CURRENT
	header[52] = 64 // e_ehsize
	return header
}

func testTargets(t *testing.T) [2]string {
	t.Helper()
	return [2]string{filepath.Join(t.TempDir(), "tailscale"), filepath.Join(t.TempDir(), "tailscaled")}
}

func serveArchive(t *testing.T, data []byte) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write(data) }))
	t.Cleanup(server.Close)
	return server
}

func stageTestArchive(t *testing.T, ctx context.Context, client *http.Client, url string, data []byte, targets [2]string) (*stagedInstall, error) {
	t.Helper()
	digest := sha256.Sum256(data)
	return stageInstall(ctx, client, url, testTailscaleVersion, fmt.Sprintf("%x", digest[:]), targets)
}

func TestStageInstallAndPublishPair(t *testing.T) {
	data := testArchive(t, requiredTailscaleArchiveEntries())
	server := serveArchive(t, data)
	targets := testTargets(t)
	stage, err := stageTestArchive(t, context.Background(), server.Client(), server.URL, data, targets)
	if err != nil {
		t.Fatal(err)
	}
	defer stage.cleanup()
	for _, target := range targets {
		if _, err := os.Lstat(target); !os.IsNotExist(err) {
			t.Fatal("staging published a destination")
		}
	}
	if err := stage.promote(); err != nil {
		t.Fatal(err)
	}
	for _, target := range targets {
		info, err := os.Stat(target)
		if err != nil || !info.Mode().IsRegular() || info.Mode()&0o111 == 0 {
			t.Fatalf("published executable %s: %v", target, err)
		}
	}
}

func TestStageRejectsBrokenArchivesAndCleansUp(t *testing.T) {
	valid := requiredTailscaleArchiveEntries()
	cases := []struct {
		name          string
		entries       []string
		dataOverrides map[string][]byte
		typeOverrides map[string]byte
	}{
		{name: "missing required files", entries: []string{"tailscale"}},
		{name: "duplicate binary", entries: append(append([]string{}, valid...), "tailscale")},
		{name: "path traversal", entries: append(append([]string{}, valid...), "../escape")},
		{name: "unexpected payload", entries: append(append([]string{}, valid...), "README")},
		{name: "symlink binary", entries: valid, typeOverrides: map[string]byte{"tailscale": tar.TypeSymlink}},
		{name: "shared object instead of executable", entries: valid, dataOverrides: map[string][]byte{"tailscale": func() []byte { h := riscvELFHeader(); h[16] = 3; return h }()}},
		{name: "wrong ELF architecture", entries: valid, dataOverrides: map[string][]byte{"tailscaled": func() []byte { h := riscvELFHeader(); h[18] = 62; return h }()}},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			data := testArchiveWithOverrides(t, test.entries, test.dataOverrides, test.typeOverrides)
			server := serveArchive(t, data)
			targets := testTargets(t)
			if _, err := stageTestArchive(t, context.Background(), server.Client(), server.URL, data, targets); err == nil {
				t.Fatal("invalid archive accepted")
			}
			for _, target := range targets {
				files, err := os.ReadDir(filepath.Dir(target))
				if err != nil || len(files) != 0 {
					t.Fatalf("failed stage left files: %v, %v", files, err)
				}
			}
		})
	}
}

func TestStageRejectsDigestMismatchBeforePromotion(t *testing.T) {
	data := testArchive(t, requiredTailscaleArchiveEntries())
	server := serveArchive(t, data)
	targets := testTargets(t)
	if _, err := stageInstall(context.Background(), server.Client(), server.URL, testTailscaleVersion, strings.Repeat("0", 64), targets); err == nil || !strings.Contains(err.Error(), "SHA-256") {
		t.Fatalf("digest mismatch = %v, want SHA-256 error", err)
	}
	for _, target := range targets {
		entries, err := os.ReadDir(filepath.Dir(target))
		if err != nil || len(entries) != 0 {
			t.Fatalf("digest mismatch left files: %v, %v", entries, err)
		}
	}
}

func TestInstallMetadataValidation(t *testing.T) {
	const digest = "06989538da8f4cb773a43a039e3477caf5c028ba66ff7eaa9809eef37e06654d"
	if version, gotDigest, err := validateInstallMetadata("1.102.3", digest); err != nil || version != "1.102.3" || gotDigest != digest {
		t.Fatalf("valid metadata = (%q, %q, %v)", version, gotDigest, err)
	}
	for _, test := range []struct {
		version string
		digest  string
	}{
		{version: "latest", digest: digest},
		{version: "1.102.3", digest: strings.ToUpper(digest)},
		{version: "1.102.3", digest: "not-a-digest"},
	} {
		if _, _, err := validateInstallMetadata(test.version, test.digest); err == nil {
			t.Fatalf("invalid metadata accepted: version=%q digest=%q", test.version, test.digest)
		}
	}
}

// The version is taken from the archive the latest URL resolved to, so a
// redirect that lands anywhere else must not be installed.
func TestVersionFromArchiveURL(t *testing.T) {
	version, err := versionFromArchiveURL("https://pkgs.tailscale.com/stable/tailscale_1.102.4_riscv64.tgz")
	if err != nil || version != "1.102.4" {
		t.Fatalf("versionFromArchiveURL() = (%q, %v)", version, err)
	}
	for _, url := range []string{
		"https://pkgs.tailscale.com/stable/tailscale_latest_riscv64.tgz",
		"https://pkgs.tailscale.com/stable/tailscale_1.102.4_arm64.tgz",
		"https://pkgs.tailscale.com/stable/tailscale_1.102_riscv64.tgz",
		"https://example.invalid/download",
	} {
		if version, err := versionFromArchiveURL(url); err == nil {
			t.Fatalf("versionFromArchiveURL(%q) accepted %q", url, version)
		}
	}
}

func TestParsePublishedDigest(t *testing.T) {
	const digest = "06989538da8f4cb773a43a039e3477caf5c028ba66ff7eaa9809eef37e06654d"
	for _, content := range []string{
		digest,
		digest + "\n",
		digest + "  tailscale_1.102.3_riscv64.tgz\n",
	} {
		got, err := parsePublishedDigest(content)
		if err != nil || got != digest {
			t.Fatalf("parsePublishedDigest(%q) = (%q, %v)", content, got, err)
		}
	}
	for _, content := range []string{
		"",
		"not-a-digest",
		strings.ToUpper(digest),
		"<html>404</html>",
	} {
		if got, err := parsePublishedDigest(content); err == nil {
			t.Fatalf("parsePublishedDigest(%q) accepted %q", content, got)
		}
	}
}

func TestVerifyArchiveDigest(t *testing.T) {
	archive := filepath.Join(t.TempDir(), "asset.tgz")
	contents := []byte("trusted Tailscale release asset")
	if err := os.WriteFile(archive, contents, 0o600); err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256(contents)
	if err := verifyArchiveDigest(archive, fmt.Sprintf("%x", digest[:])); err != nil {
		t.Fatalf("verifyArchiveDigest: %v", err)
	}
	if err := verifyArchiveDigest(archive, strings.Repeat("0", 64)); err == nil {
		t.Fatal("verifyArchiveDigest accepted a mismatched digest")
	}
}

func TestPublishCollisionRollsBackOnlyOwnFiles(t *testing.T) {
	data := testArchive(t, requiredTailscaleArchiveEntries())
	server := serveArchive(t, data)
	for _, collision := range []int{0, 1} {
		t.Run(string(rune('0'+collision)), func(t *testing.T) {
			targets := testTargets(t)
			stage, err := stageTestArchive(t, context.Background(), server.Client(), server.URL, data, targets)
			if err != nil {
				t.Fatal(err)
			}
			defer stage.cleanup()
			stage.link = func(source, target string) error {
				if target == targets[collision] {
					if err := os.WriteFile(target, []byte("existing"), 0o755); err != nil {
						return err
					}
				}
				return os.Link(source, target)
			}
			if err := stage.promote(); err == nil {
				t.Fatal("collision accepted")
			}
			data, err := os.ReadFile(targets[collision])
			if err != nil || string(data) != "existing" {
				t.Fatalf("collision target changed: %s, %v", data, err)
			}
			if _, err := os.Lstat(targets[1-collision]); !os.IsNotExist(err) {
				t.Fatal("partial pair remained after failed promotion")
			}
		})
	}
}

func TestPendingDownloadLeavesLifecycleAvailableAndCancels(t *testing.T) {
	for _, flushHeaders := range []bool{false, true} {
		t.Run(map[bool]string{false: "headers", true: "body"}[flushHeaders], func(t *testing.T) {
			entered := make(chan struct{})
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if flushHeaders {
					w.WriteHeader(http.StatusOK)
					w.(http.Flusher).Flush()
				}
				close(entered)
				<-r.Context().Done()
			}))
			defer server.Close()
			if !vpnpref.TryLock() {
				t.Fatal("lifecycle lock busy")
			}
			ctx, token, finish := vpnpref.BeginStagedInstall(context.Background())
			vpnpref.Unlock()
			defer finish()
			targets := testTargets(t)
			result := make(chan error, 1)
			go func() {
				_, err := stageInstall(ctx, server.Client(), server.URL, testTailscaleVersion, strings.Repeat("0", 64), targets)
				result <- err
			}()
			select {
			case <-entered:
			case <-time.After(time.Second):
				t.Fatal("download did not start")
			}
			if !vpnpref.TryLock() {
				t.Fatal("download blocks lifecycle")
			}
			vpnpref.InvalidateStagedInstalls()
			current := vpnpref.StagedInstallCurrent(token)
			vpnpref.Unlock()
			if current {
				t.Fatal("canceled stage remains publishable")
			}
			select {
			case err := <-result:
				if err == nil {
					t.Fatal("canceled download succeeded")
				}
			case <-time.After(time.Second):
				t.Fatal("download did not cancel")
			}
			for _, target := range targets {
				files, _ := os.ReadDir(filepath.Dir(target))
				if len(files) != 0 {
					t.Fatal("cancellation leaked staging files")
				}
			}
		})
	}
}

func TestRollbackDoesNotRemoveAReplacedDestination(t *testing.T) {
	data := testArchive(t, requiredTailscaleArchiveEntries())
	server := serveArchive(t, data)
	targets := testTargets(t)
	stage, err := stageTestArchive(t, context.Background(), server.Client(), server.URL, data, targets)
	if err != nil {
		t.Fatal(err)
	}
	defer stage.cleanup()
	stage.link = func(source, target string) error {
		if target == targets[1] {
			if err := os.Remove(targets[0]); err != nil {
				return err
			}
			if err := os.WriteFile(targets[0], []byte("replacement"), 0o755); err != nil {
				return err
			}
			return errors.New("second publish failed")
		}
		return os.Link(source, target)
	}
	err = stage.promote()
	if err == nil || !strings.Contains(err.Error(), "cannot safely roll back") {
		t.Fatalf("rollback uncertainty not reported: %v", err)
	}
	data, err = os.ReadFile(targets[0])
	if err != nil || string(data) != "replacement" {
		t.Fatalf("replacement was removed: %s, %v", data, err)
	}
}

func TestDownloadHasFiniteClientTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { <-r.Context().Done() }))
	defer server.Close()
	client := &http.Client{Timeout: 25 * time.Millisecond}
	if _, err := stageInstall(context.Background(), client, server.URL, testTailscaleVersion, strings.Repeat("0", 64), testTargets(t)); err == nil {
		t.Fatal("stalled request succeeded")
	}
}

func TestCorruptGzipTrailerIsRejected(t *testing.T) {
	data := testArchive(t, requiredTailscaleArchiveEntries())
	data[len(data)-8] ^= 0xff
	server := serveArchive(t, data)
	if _, err := stageTestArchive(t, context.Background(), server.Client(), server.URL, data, testTargets(t)); err == nil || err == io.EOF {
		t.Fatalf("corrupt archive accepted: %v", err)
	}
}

func TestInstallArtifactsKeepPartialAndNonExecutableRecoveryVisible(t *testing.T) {
	targets := testTargets(t)
	if installArtifactsExist(targets) || installedPair(targets) {
		t.Fatal("empty targets look installed")
	}
	if err := os.WriteFile(targets[0], []byte("partial"), 0o600); err != nil {
		t.Fatal(err)
	}
	if !installArtifactsExist(targets) || installedPair(targets) {
		t.Fatal("partial install was not distinguished from a complete pair")
	}
	if err := os.WriteFile(targets[1], []byte("manual recovery"), 0o600); err != nil {
		t.Fatal(err)
	}
	if !installedPair(targets) {
		t.Fatal("a complete non-executable pair should remain recoverable by Cli.Start")
	}
}
