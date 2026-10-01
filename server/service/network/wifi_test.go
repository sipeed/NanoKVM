package network

import (
	"os"
	"path/filepath"
	"testing"
)

func TestWritePrivateFile(t *testing.T) {
	tests := []struct {
		name     string
		existing bool
	}{
		{name: "new file"},
		{name: "tighten existing file", existing: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "wifi.pass")
			if test.existing {
				if err := os.WriteFile(path, []byte("old"), 0o644); err != nil {
					t.Fatal(err)
				}
			}

			if err := writePrivateFile(path, []byte("new secret")); err != nil {
				t.Fatal(err)
			}

			content, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			if string(content) != "new secret" {
				t.Fatalf("unexpected content: %q", content)
			}

			info, err := os.Stat(path)
			if err != nil {
				t.Fatal(err)
			}
			if mode := info.Mode().Perm(); mode != 0o600 {
				t.Fatalf("mode = %04o, want 0600", mode)
			}
		})
	}
}
