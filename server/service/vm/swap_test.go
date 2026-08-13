package vm

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// useSwapFile points the swap service at a temporary file and captures the
// shell commands it issues instead of running them. It returns the swap file
// path and a pointer to the captured commands.
func useSwapFile(t *testing.T, create bool) (string, *[]string) {
	t.Helper()

	path := filepath.Join(t.TempDir(), "swapfile")
	if create {
		if err := os.WriteFile(path, make([]byte, 64), 0o600); err != nil {
			t.Fatalf("failed to write swap file: %s", err)
		}
	}

	originalFile := SwapFile
	originalRunner := runShellCommand
	t.Cleanup(func() {
		SwapFile = originalFile
		runShellCommand = originalRunner
	})

	var commands []string
	SwapFile = path
	runShellCommand = func(command string) error {
		commands = append(commands, command)
		return nil
	}

	return path, &commands
}

// useSwapsFile writes a /proc/swaps stand-in for one test.
func useSwapsFile(t *testing.T, content string) {
	t.Helper()

	original := procSwapsPath
	t.Cleanup(func() {
		procSwapsPath = original
	})

	path := filepath.Join(t.TempDir(), "swaps")
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("failed to write swaps file: %s", err)
	}

	procSwapsPath = path
}

func TestDisableSwapNeverTurnsOffEveryDevice(t *testing.T) {
	// `swapoff -a` also stops zram, so a change to the swap file size used to
	// disable compressed swap as a side effect. The command must name the file.
	path, commands := useSwapFile(t, true)
	useSwapsFile(t, "Filename\tType\tSize\tUsed\tPriority\n"+
		"/dev/zram0\tpartition\t98300\t3200\t100\n"+
		path+"\tfile\t262140\t0\t-2\n")

	if err := disableSwap(); err != nil {
		t.Fatalf("disableSwap() returned %s", err)
	}

	if len(*commands) != 1 {
		t.Fatalf("ran %d commands, want 1: %v", len(*commands), *commands)
	}
	if got := (*commands)[0]; got != "swapoff "+path {
		t.Errorf("ran %q, want %q", got, "swapoff "+path)
	}
	for _, command := range *commands {
		if strings.Contains(command, "swapoff -a") {
			t.Errorf("ran %q, which also stops zram", command)
		}
	}
}

func TestDisableSwapRemovesTheFile(t *testing.T) {
	path, _ := useSwapFile(t, true)
	useSwapsFile(t, path+"\tfile\t262140\t0\t-2\n")

	if err := disableSwap(); err != nil {
		t.Fatalf("disableSwap() returned %s", err)
	}

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Errorf("swap file still exists after disableSwap()")
	}
}

func TestDisableSwapSkipsSwapoffForAnInactiveFile(t *testing.T) {
	// The file exists but was never swapped on, which happens after a reboot
	// with no inittab entry. swapoff would fail on it, and that failure used
	// to be hidden by the -a form succeeding on other devices.
	path, commands := useSwapFile(t, true)
	useSwapsFile(t, "Filename\tType\tSize\tUsed\tPriority\n")

	if err := disableSwap(); err != nil {
		t.Fatalf("disableSwap() returned %s", err)
	}

	if len(*commands) != 0 {
		t.Errorf("ran %v, want no commands", *commands)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Errorf("swap file still exists after disableSwap()")
	}
}

func TestDisableSwapSucceedsWithNoSwapFile(t *testing.T) {
	// Disabling an already disabled device must not report a failure.
	_, commands := useSwapFile(t, false)
	useSwapsFile(t, "")

	if err := disableSwap(); err != nil {
		t.Fatalf("disableSwap() returned %s", err)
	}

	if len(*commands) != 0 {
		t.Errorf("ran %v, want no commands", *commands)
	}
}
