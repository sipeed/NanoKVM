package application

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestWorkspaceCleanupIsScopedToUpdaterDirectories(t *testing.T) {
	base := t.TempDir()
	for _, name := range []string{"nanokvm-update-old", "update-other", "firmware.tar.xz", "nanokvm-go_1.0.0"} {
		if err := os.Mkdir(filepath.Join(base, name), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	if err := cleanupStaleWorkspaces(base); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(base, "nanokvm-update-old")); !os.IsNotExist(err) {
		t.Fatalf("stale workspace still exists: %v", err)
	}
	for _, name := range []string{"update-other", "firmware.tar.xz", "nanokvm-go_1.0.0"} {
		if _, err := os.Stat(filepath.Join(base, name)); err != nil {
			t.Fatalf("unrelated cache entry %s was removed: %v", name, err)
		}
	}
}

func TestNewWorkspaceIsPrivateAndCloseOnlyRemovesItself(t *testing.T) {
	base := t.TempDir()
	keep := filepath.Join(base, "keep")
	if err := os.WriteFile(keep, []byte("keep"), 0o600); err != nil {
		t.Fatal(err)
	}
	workspace, err := newUpdateWorkspace(base)
	if err != nil {
		t.Fatal(err)
	}
	if filepath.Dir(workspace.dir) != base || !strings.HasPrefix(filepath.Base(workspace.dir), updateWorkspacePrefix) {
		t.Fatalf("unexpected workspace path %q", workspace.dir)
	}
	if err := workspace.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(keep); err != nil {
		t.Fatalf("unrelated cache entry was removed: %v", err)
	}
}
