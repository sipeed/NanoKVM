package controlmode

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestManagerDefaultsToPicoclaw(t *testing.T) {
	manager := NewManager(filepath.Join(t.TempDir(), "mode"), ModePicoclaw)
	if got := manager.Current(); got != ModePicoclaw {
		t.Fatalf("mode = %q, want %q", got, ModePicoclaw)
	}
}

func TestSwitchPreemptsBeforeWaitingForActiveWrite(t *testing.T) {
	manager := NewManager(filepath.Join(t.TempDir(), "mode"), ModeMCP)
	release, err := manager.AcquireWrite(ModeMCP)
	if err != nil {
		t.Fatal(err)
	}

	preempted := make(chan struct{})
	done := make(chan error, 1)
	go func() {
		done <- manager.Switch(ModePicoclaw, func() error {
			close(preempted)
			return nil
		})
	}()

	select {
	case <-preempted:
	case <-time.After(time.Second):
		t.Fatal("preempt callback was not called before waiting")
	}
	if _, err := manager.AcquireWrite(ModeMCP); err == nil {
		t.Fatal("new write acquired control during transition")
	}

	release()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(time.Second):
		t.Fatal("switch did not resume after active write was released")
	}
	if got := manager.Current(); got != ModePicoclaw {
		t.Fatalf("mode = %q, want picoclaw", got)
	}
}

func TestSwitchRunsCleanupAfterActiveWritesDrain(t *testing.T) {
	manager := NewManager(filepath.Join(t.TempDir(), "mode"), ModePicoclaw)
	release, err := manager.AcquireWrite(ModePicoclaw)
	if err != nil {
		t.Fatal(err)
	}

	cleanupCalled := make(chan struct{})
	done := make(chan error, 1)
	go func() {
		done <- manager.SwitchWithCleanup(ModeMCP, nil, func() error {
			close(cleanupCalled)
			return nil
		})
	}()

	select {
	case <-cleanupCalled:
		t.Fatal("cleanup ran before active write drained")
	case <-time.After(20 * time.Millisecond):
	}

	release()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(time.Second):
		t.Fatal("switch did not finish")
	}
	select {
	case <-cleanupCalled:
	default:
		t.Fatal("cleanup was not called")
	}
}

func TestSwitchCleanupFailureFailsClosed(t *testing.T) {
	path := filepath.Join(t.TempDir(), "mode")
	manager := NewManager(path, ModePicoclaw)
	wantErr := errors.New("hid release failed")

	if err := manager.SwitchWithCleanup(ModeMCP, nil, func() error { return wantErr }); !errors.Is(err, wantErr) {
		t.Fatalf("error = %v, want %v", err, wantErr)
	}
	if got := manager.Current(); got != ModeOff {
		t.Fatalf("mode = %q, want off after cleanup failure", got)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "off\n" {
		t.Fatalf("mode file = %q, want off", data)
	}
}

func TestSwitchIfKeepsDifferentMode(t *testing.T) {
	manager := NewManager(filepath.Join(t.TempDir(), "mode"), ModePicoclaw)
	switched, err := manager.SwitchIf(ModeMCP, ModeOff, nil)
	if err != nil {
		t.Fatal(err)
	}
	if switched || manager.Current() != ModePicoclaw {
		t.Fatalf("switched=%v mode=%q, want unchanged picoclaw", switched, manager.Current())
	}
}

func TestSwitchTimeoutDoesNotLeaveManagerTransitioning(t *testing.T) {
	manager := NewManager(filepath.Join(t.TempDir(), "mode"), ModeMCP)
	manager.activityWaitTimeout = 20 * time.Millisecond
	cleanupCalled := false

	status, release, err := manager.AcquireStable()
	if err != nil {
		t.Fatal(err)
	}
	if status.Mode != ModeMCP {
		t.Fatalf("mode = %q, want MCP", status.Mode)
	}

	err = manager.SwitchWithCleanup(ModePicoclaw, nil, func() error {
		cleanupCalled = true
		return nil
	})
	if !errors.Is(err, ErrActivityWaitTimeout) {
		t.Fatalf("switch error = %v, want %v", err, ErrActivityWaitTimeout)
	}
	if cleanupCalled {
		t.Fatal("cleanup ran even though exclusive activity lease was not acquired")
	}
	status, err = manager.Status()
	if err != nil {
		t.Fatal(err)
	}
	if status.Mode != ModeMCP || status.Transitioning {
		t.Fatalf("status after timeout = %+v, want stable MCP", status)
	}

	release()
	if err := manager.Switch(ModePicoclaw, nil); err != nil {
		t.Fatalf("switch after lease release failed: %v", err)
	}
}

func TestInvalidModeFailsClosed(t *testing.T) {
	path := filepath.Join(t.TempDir(), "mode")
	if err := os.WriteFile(path, []byte("invalid\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	manager := NewManager(path, ModePicoclaw)
	status, err := manager.Status()
	if err != nil {
		t.Fatal(err)
	}
	if status.Mode != ModeOff {
		t.Fatalf("mode = %q, want off", status.Mode)
	}
	if !strings.Contains(status.LastError, "invalid") {
		t.Fatalf("last_error = %q, want invalid mode detail", status.LastError)
	}
}

func TestStatusReloadsExternallyModifiedModeFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "mode")
	if err := os.WriteFile(path, []byte("off\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	manager := NewManager(path, ModePicoclaw)
	if got := manager.Current(); got != ModeOff {
		t.Fatalf("initial mode = %q, want off", got)
	}

	if err := os.WriteFile(path, []byte("mcp\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	modTime := time.Now().Add(time.Second)
	if err := os.Chtimes(path, modTime, modTime); err != nil {
		t.Fatal(err)
	}
	if got := manager.Current(); got != ModeMCP {
		t.Fatalf("mode after external write = %q, want MCP", got)
	}
}
