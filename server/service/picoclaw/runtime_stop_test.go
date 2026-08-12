package picoclaw

import (
	"errors"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestStopRuntimeProcessAndVerifyForceStopRunsStopBeforeChecking(t *testing.T) {
	stopCalled := false
	err := stopRuntimeProcessAndVerify(
		true,
		func() (bool, error) {
			if !stopCalled {
				return false, errors.New("runtime checked before compensating stop")
			}
			return false, nil
		},
		func() error {
			stopCalled = true
			return nil
		},
		time.Second,
		time.Millisecond,
	)
	if err != nil {
		t.Fatal(err)
	}
	if !stopCalled {
		t.Fatal("compensating stop was not called")
	}
}

func TestStopRuntimeProcessAndVerifyWaitsForExit(t *testing.T) {
	checks := 0
	stopCalled := false
	err := stopRuntimeProcessAndVerify(
		false,
		func() (bool, error) {
			checks++
			switch checks {
			case 1:
				return true, nil
			case 2:
				if !stopCalled {
					return false, errors.New("runtime verified before stop")
				}
				return true, nil
			default:
				return false, nil
			}
		},
		func() error {
			stopCalled = true
			return nil
		},
		time.Second,
		0,
	)
	if err != nil {
		t.Fatal(err)
	}
	if !stopCalled || checks != 3 {
		t.Fatalf("stopCalled=%v checks=%d, want true and 3", stopCalled, checks)
	}
}

func TestStopRuntimeProcessAndVerifyIgnoresStopErrorAfterExit(t *testing.T) {
	checks := 0
	wantStopErr := errors.New("stop command failed after cleanup")
	err := stopRuntimeProcessAndVerify(
		false,
		func() (bool, error) {
			checks++
			return checks == 1, nil
		},
		func() error { return wantStopErr },
		time.Second,
		0,
	)
	if err != nil {
		t.Fatalf("error = %v, want nil after runtime exits", err)
	}
	if checks != 2 {
		t.Fatalf("checks = %d, want 2", checks)
	}
}

func TestStopRuntimeProcessAndVerifyReportsStopAndVerificationFailures(t *testing.T) {
	wantStopErr := errors.New("stop command failed")
	err := stopRuntimeProcessAndVerify(
		true,
		func() (bool, error) { return true, nil },
		func() error { return wantStopErr },
		0,
		0,
	)
	if !errors.Is(err, wantStopErr) {
		t.Fatalf("error = %v, want wrapped stop error", err)
	}
	if !strings.Contains(err.Error(), "PicoClaw runtime is still running") {
		t.Fatalf("error = %v, want verification failure", err)
	}
}

func TestStopRuntimeCloseSessionsDoesNotRequireHIDRelease(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())
	service := &Service{
		runtime: getRuntimeStore(),
		releaseHID: func() error {
			return errors.New("hid unavailable")
		},
	}

	if err := service.stopRuntimeAndCloseSessions(CloseCodeRuntimeStopped, "test stop"); err != nil {
		t.Fatalf("stopRuntimeAndCloseSessions error = %v, want nil", err)
	}
}

func TestStopRuntimeCloseSessionsReleasesStaleLock(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())
	lock := &SessionLock{}
	lock.ForceTakeover("stale-session")
	service := &Service{
		lock:    lock,
		runtime: getRuntimeStore(),
	}

	if err := service.stopRuntimeAndCloseSessions(CloseCodeRuntimeStopped, "test stop"); err != nil {
		t.Fatalf("stopRuntimeAndCloseSessions error = %v, want nil", err)
	}
	if owner := lock.Owner(); owner != "" {
		t.Fatalf("lock owner = %q, want released", owner)
	}
}

func TestPreemptControlLeasesForMCPDoesNotStopRuntimeOrChangeIntent(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())
	intentStore := NewRuntimeIntentStore(filepath.Join(t.TempDir(), "picoclaw-runtime.json"))
	if err := intentStore.SetDesiredRunning(true, "test"); err != nil {
		t.Fatal(err)
	}

	lock := &SessionLock{}
	lock.ForceTakeover("session-1")
	service := &Service{
		lock:          lock,
		runtime:       &RuntimeStore{status: RuntimeStatus{Ready: true, Status: "ready"}},
		runtimeIntent: intentStore,
		operations:    newControlOperationTracker(),
	}

	if err := service.PreemptControlLeasesForMCP(); err != nil {
		t.Fatal(err)
	}
	if owner := lock.Owner(); owner != "" {
		t.Fatalf("lock owner = %q, want released", owner)
	}
	status := service.runtime.Get()
	if !status.Ready || status.Status != "ready" {
		t.Fatalf("runtime status changed during soft preempt: %+v", status)
	}
	intent, err := intentStore.Load()
	if err != nil {
		t.Fatal(err)
	}
	if !intent.DesiredRunning || intent.UpdatedBy != "test" {
		t.Fatalf("runtime intent changed during soft preempt: %+v", intent)
	}
}

func TestStopRuntimeForMCPStopsRuntimeAndDisablesIntent(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())
	intentStore := NewRuntimeIntentStore(filepath.Join(t.TempDir(), "picoclaw-runtime.json"))
	if err := intentStore.SetDesiredRunning(true, "test"); err != nil {
		t.Fatal(err)
	}

	service := &Service{
		runtime:       &RuntimeStore{status: RuntimeStatus{Ready: true, Status: "ready"}},
		runtimeIntent: intentStore,
	}

	if err := service.StopRuntimeForMCP(); err != nil {
		t.Fatal(err)
	}
	status := service.runtime.Get()
	if status.Ready || status.Status != "stopped" {
		t.Fatalf("runtime status = %+v, want stopped", status)
	}
	intent, err := intentStore.Load()
	if err != nil {
		t.Fatal(err)
	}
	if intent.DesiredRunning || intent.UpdatedBy != "mcp_preempt" {
		t.Fatalf("runtime intent = %+v, want disabled by mcp_preempt", intent)
	}
}

func TestEnsureDependenciesInitializesRuntimeFields(t *testing.T) {
	service := &Service{}
	service.ensureDependencies()

	if service.config == nil {
		t.Fatal("config store was not initialized")
	}
	if service.lock == nil {
		t.Fatal("session lock was not initialized")
	}
	if service.runtime == nil {
		t.Fatal("runtime store was not initialized")
	}
	if service.control == nil {
		t.Fatal("control manager was not initialized")
	}
	if service.operations == nil {
		t.Fatal("control operation tracker was not initialized")
	}
	if service.releaseHID == nil {
		t.Fatal("HID release callback was not initialized")
	}
}

func TestIsPicoclawGatewayCmdlineOnlyMatchesGatewaySubcommand(t *testing.T) {
	if !isPicoclawGatewayCmdline([]byte("/usr/bin/picoclaw\x00gateway\x00")) {
		t.Fatal("gateway command was not recognized")
	}
	if isPicoclawGatewayCmdline([]byte("/usr/bin/picoclaw\x00agent\x00")) {
		t.Fatal("agent command was recognized as gateway")
	}
	if isPicoclawGatewayCmdline([]byte("/usr/bin/other\x00gateway\x00")) {
		t.Fatal("other binary was recognized as picoclaw gateway")
	}
}
