package hid

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestGetHidMode(t *testing.T) {
	tests := []struct {
		name string
		flag string
		want string
	}{
		{name: "normal", flag: "0x0510\n", want: ModeNormal},
		{name: "hid only", flag: "0x0623\n", want: ModeHidOnly},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			withModeFlag(t, tt.flag)

			got, err := getHidMode()
			if err != nil {
				t.Fatal(err)
			}
			if got != tt.want {
				t.Fatalf("getHidMode() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestGetHidModeRejectsUnknownBcdDevice(t *testing.T) {
	withModeFlag(t, "0x9999\n")

	if _, err := getHidMode(); err == nil {
		t.Fatal("getHidMode succeeded for an unknown bcdDevice")
	}
}

func TestGetHidModeRequiresModeFlag(t *testing.T) {
	oldModeFlag := modeFlag
	t.Cleanup(func() {
		modeFlag = oldModeFlag
	})
	modeFlag = filepath.Join(t.TempDir(), "missing-bcdDevice")

	if _, err := getHidMode(); err == nil {
		t.Fatal("getHidMode succeeded with a missing bcdDevice")
	}
}

func TestCopyModeFileCopiesScriptAtomically(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("script mode assertions are POSIX-specific")
	}

	dir := t.TempDir()
	src := filepath.Join(dir, "S03usbhid")
	dst := filepath.Join(dir, "S03usbdev")
	content := []byte("#!/bin/sh\nexit 0\n")
	if err := os.WriteFile(src, content, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(dst, []byte("old"), 0o644); err != nil {
		t.Fatal(err)
	}

	oldUSBDevScript := USBDevScript
	t.Cleanup(func() {
		USBDevScript = oldUSBDevScript
	})
	USBDevScript = dst

	if err := copyModeFile(src); err != nil {
		t.Fatal(err)
	}

	got, err := os.ReadFile(dst)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != string(content) {
		t.Fatalf("target content = %q, want %q", got, content)
	}

	info, err := os.Stat(dst)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o755 {
		t.Fatalf("target mode = %v, want 0755", info.Mode().Perm())
	}

	leftovers, err := filepath.Glob(filepath.Join(dir, ".S03usbdev-*"))
	if err != nil {
		t.Fatal(err)
	}
	if len(leftovers) != 0 {
		t.Fatalf("temporary mode files left behind: %v", leftovers)
	}
}

func TestCopyModeFileFailureKeepsTarget(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "missing")
	dst := filepath.Join(dir, "S03usbdev")
	oldContent := []byte("old script\n")
	if err := os.WriteFile(dst, oldContent, 0o755); err != nil {
		t.Fatal(err)
	}

	oldUSBDevScript := USBDevScript
	t.Cleanup(func() {
		USBDevScript = oldUSBDevScript
	})
	USBDevScript = dst

	if err := copyModeFile(src); err == nil {
		t.Fatal("copyModeFile succeeded with a missing source")
	}

	got, err := os.ReadFile(dst)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != string(oldContent) {
		t.Fatalf("target changed after failed copy: got %q, want %q", got, oldContent)
	}
}

func withModeFlag(t *testing.T, content string) {
	t.Helper()

	oldModeFlag := modeFlag
	t.Cleanup(func() {
		modeFlag = oldModeFlag
	})

	modeFlag = filepath.Join(t.TempDir(), "bcdDevice")
	if err := os.WriteFile(modeFlag, []byte(content), 0o666); err != nil {
		t.Fatal(err)
	}
}
