package hid

import (
	"os"
	"path/filepath"
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
			got, err := getHidMode(writeModeFlag(t, tt.flag))
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
	if _, err := getHidMode(writeModeFlag(t, "0x9999\n")); err == nil {
		t.Fatal("getHidMode succeeded for an unknown bcdDevice")
	}
}

func TestGetHidModeRequiresModeFlag(t *testing.T) {
	if _, err := getHidMode(filepath.Join(t.TempDir(), "missing-bcdDevice")); err == nil {
		t.Fatal("getHidMode succeeded with a missing bcdDevice")
	}
}

func writeModeFlag(t *testing.T, content string) string {
	t.Helper()

	modeFlag := filepath.Join(t.TempDir(), "bcdDevice")
	if err := os.WriteFile(modeFlag, []byte(content), 0o666); err != nil {
		t.Fatal(err)
	}
	return modeFlag
}
