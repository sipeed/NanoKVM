package vpnpref

import (
	"os"
	"path/filepath"
	"testing"
)

func TestWriteAtomicallyReplacesPreference(t *testing.T) {
	dir := t.TempDir()
	oldPath := filePath
	filePath = filepath.Join(dir, "vpn")
	t.Cleanup(func() { filePath = oldPath })

	if err := os.WriteFile(filePath, []byte(Tailscale), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := Write(Netbird); err != nil {
		t.Fatalf("Write: %v", err)
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}
	if got := string(data); got != Netbird {
		t.Fatalf("preference = %q, want %q", got, Netbird)
	}
	info, err := os.Stat(filePath)
	if err != nil {
		t.Fatal(err)
	}
	if got := info.Mode().Perm(); got != 0o644 {
		t.Fatalf("mode = %o, want 644", got)
	}
}

func TestWriteRejectsUnknownPreference(t *testing.T) {
	oldPath := filePath
	filePath = filepath.Join(t.TempDir(), "vpn")
	t.Cleanup(func() { filePath = oldPath })

	if err := Write("wireguard"); err == nil {
		t.Fatal("Write accepted unknown preference")
	}
	if _, err := os.Stat(filePath); !os.IsNotExist(err) {
		t.Fatalf("unexpected preference file after rejected write: %v", err)
	}
}
