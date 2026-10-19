package utils

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestCanonicalPathInside(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, "Images", "Sub"))
	mustWrite(t, filepath.Join(root, "Images", "Win.iso"))
	mustWrite(t, filepath.Join(root, "Images", "notes.txt"))

	tests := []struct {
		rel  string
		want string
	}{
		{"/", root},
		{"images", filepath.Join(root, "Images")},
		{"IMAGES", filepath.Join(root, "Images")},
		{"images/sub", filepath.Join(root, "Images", "Sub")},
		{"images/WIN.ISO", filepath.Join(root, "Images", "Win.iso")},
		{"IMAGES/NOTES.TXT", filepath.Join(root, "Images", "notes.txt")},
		// A missing component keeps the requested spelling from there on.
		{"images/new/File.bin", filepath.Join(root, "Images", "new", "File.bin")},
	}

	for _, tt := range tests {
		got, err := CanonicalPathInside(root, tt.rel)
		if err != nil {
			t.Errorf("CanonicalPathInside(%q) error: %v", tt.rel, err)
			continue
		}
		if got != tt.want {
			t.Errorf("CanonicalPathInside(%q) = %q, want %q", tt.rel, got, tt.want)
		}
	}
}

func TestCanonicalPathInsideAmbiguous(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, "a"))
	mustMkdir(t, filepath.Join(root, "A"))
	if _, err := os.Stat(filepath.Join(root, "a")); err != nil {
		t.Skip("case-insensitive filesystem")
	}
	entries, _ := os.ReadDir(root)
	if len(entries) != 2 {
		t.Skip("case-insensitive filesystem")
	}

	// An exact match wins over a fold.
	if got, err := CanonicalPathInside(root, "a"); err != nil || got != filepath.Join(root, "a") {
		t.Errorf("exact match = %q, %v", got, err)
	}
	// Two folds and no exact match is refused instead of guessed.
	mustMkdir(t, filepath.Join(root, "Bb"))
	mustMkdir(t, filepath.Join(root, "bB"))
	if _, err := CanonicalPathInside(root, "bb"); !errors.Is(err, ErrInvalidMediaID) {
		t.Errorf("ambiguous fold error = %v, want ErrInvalidMediaID", err)
	}
}

func mustMkdir(t *testing.T, dir string) {
	t.Helper()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
}

func mustWrite(t *testing.T, file string) {
	t.Helper()
	if err := os.WriteFile(file, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
}
