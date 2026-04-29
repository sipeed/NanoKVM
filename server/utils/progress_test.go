package utils

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
)

func TestValidateFlatFilename(t *testing.T) {
	valid := []string{
		"NanoKVM_1.2-3.iso",
		"update.tar.gz",
	}
	for _, name := range valid {
		if err := ValidateFlatFilename(name); err != nil {
			t.Fatalf("expected %q to be valid: %v", name, err)
		}
	}

	invalid := []string{
		"../update.tar.gz",
		"nested/update.tar.gz",
		"bad name.iso",
	}
	for _, name := range invalid {
		if err := ValidateFlatFilename(name); err == nil {
			t.Fatalf("expected %q to be invalid", name)
		}
	}
}

func TestProgressWriterUpdatesStatusFile(t *testing.T) {
	statusPath := filepath.Join(t.TempDir(), "progress")
	if err := os.WriteFile(statusPath, []byte("image.iso"), 0o644); err != nil {
		t.Fatalf("write status file: %v", err)
	}

	var out bytes.Buffer
	pw := NewProgressWriter(&out, 4, statusPath)
	defer pw.Stop()

	if _, err := pw.Write([]byte("ab")); err != nil {
		t.Fatalf("write progress: %v", err)
	}
	pw.updateStatus()

	content, err := os.ReadFile(statusPath)
	if err != nil {
		t.Fatalf("read status file: %v", err)
	}

	if got := string(content); got != "image.iso;50.00%" {
		t.Fatalf("unexpected status content %q", got)
	}
}
