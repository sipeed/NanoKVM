package inputcontrol

import (
	"context"
	"errors"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"NanoKVM-Server/service/controlmode"
)

func TestCoordinatorRejectsConcurrentMCP(t *testing.T) {
	coordinator := newCoordinator(defaultManualCooldown, time.Now)
	ctx, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	defer release()

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrMCPBusy) {
		t.Fatalf("error = %v, want %v", err, ErrMCPBusy)
	}
	coordinator.CancelMCP()
	if err := context.Cause(ctx); !errors.Is(err, ErrMCPModeChanged) {
		t.Fatalf("context cause = %v, want %v", err, ErrMCPModeChanged)
	}
}

func TestCoordinatorReleaseAllowsNextMCP(t *testing.T) {
	coordinator := newCoordinator(defaultManualCooldown, time.Now)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	release()

	_, nextRelease, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	nextRelease()
}

func TestManualInputPreemptsMCPWithoutSwitchingMode(t *testing.T) {
	now := time.Unix(100, 0)
	coordinator := newCoordinator(2*time.Second, func() time.Time { return now })
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	operationCtx, releaseOperation, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	releaseMode, err := control.Acquire(controlmode.ModeMCP)
	if err != nil {
		t.Fatal(err)
	}

	manual := NewManualSession(control, coordinator)
	type result struct {
		reservation *ManualReservation
		err         error
	}
	done := make(chan result, 1)
	go func() {
		reservation, err := manual.Reserve(context.Background(), ManualKeyboard, false, nil)
		done <- result{reservation: reservation, err: err}
	}()

	select {
	case <-operationCtx.Done():
		if cause := context.Cause(operationCtx); !errors.Is(cause, ErrManualPreempted) {
			t.Fatalf("context cause = %v, want %v", cause, ErrManualPreempted)
		}
	case <-time.After(time.Second):
		t.Fatal("manual input did not preempt active MCP operation")
	}
	releaseOperation()
	releaseMode()

	var reservation *ManualReservation
	select {
	case got := <-done:
		if got.err != nil {
			t.Fatal(got.err)
		}
		reservation = got.reservation
	case <-time.After(time.Second):
		t.Fatal("manual input did not acquire control")
	}
	if got := control.Current(); got != controlmode.ModeMCP {
		t.Fatalf("mode = %q, want MCP to remain enabled", got)
	}

	reservation.Complete(true)
	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
	}
	now = now.Add(3 * time.Second)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatalf("MCP did not resume after cooldown: %v", err)
	}
	release()
	manual.Close()
}

func TestHeldManualInputBlocksMCPUntilReleaseAndCooldown(t *testing.T) {
	now := time.Unix(200, 0)
	coordinator := newCoordinator(time.Second, func() time.Time { return now })
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	down, err := manual.Reserve(context.Background(), ManualKeyboard, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	down.Complete(true)
	now = now.Add(10 * time.Second)
	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("held input error = %v, want %v", err, ErrManualControlActive)
	}

	up, err := manual.Reserve(context.Background(), ManualKeyboard, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	up.Complete(true)
	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
	}
	now = now.Add(2 * time.Second)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	release()
}

func TestFailedHeldManualInputDoesNotRemainHeld(t *testing.T) {
	now := time.Unix(250, 0)
	coordinator := newCoordinator(time.Second, func() time.Time { return now })
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	down, err := manual.Reserve(context.Background(), ManualKeyboard, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	down.Complete(false)

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
	}
	now = now.Add(2 * time.Second)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatalf("failed held input remained active after cooldown: %v", err)
	}
	release()
}

func TestFailedReleaseReportClearsHeldManualInput(t *testing.T) {
	tests := []struct {
		name string
		kind ManualReportKind
	}{
		{name: "keyboard", kind: ManualKeyboard},
		{name: "relative mouse", kind: ManualRelativeMouse},
		{name: "absolute mouse", kind: ManualAbsoluteMouse},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			now := time.Unix(260, 0)
			coordinator := newCoordinator(time.Second, func() time.Time { return now })
			control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
			manual := NewManualSession(control, coordinator)
			defer manual.Close()

			down, err := manual.Reserve(context.Background(), tc.kind, true, nil)
			if err != nil {
				t.Fatal(err)
			}
			down.Complete(true)

			up, err := manual.Reserve(context.Background(), tc.kind, false, nil)
			if err != nil {
				t.Fatal(err)
			}
			up.Complete(false)

			if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
				t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
			}
			now = now.Add(2 * time.Second)
			_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
			if err != nil {
				t.Fatalf("failed release report left held input active: %v", err)
			}
			release()
		})
	}
}

func TestPointerMoveWithoutButtonsDoesNotStartCooldown(t *testing.T) {
	coordinator := newCoordinator(time.Second, time.Now)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	move, err := manual.ReserveWithCooldown(context.Background(), ManualAbsoluteMouse, false, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	move.Complete(true)

	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatalf("pointer move without buttons blocked MCP: %v", err)
	}
	release()
}

func TestReleaseReportForcesCooldown(t *testing.T) {
	now := time.Unix(275, 0)
	coordinator := newCoordinator(time.Second, func() time.Time { return now })
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	down, err := manual.ReserveWithCooldown(context.Background(), ManualRelativeMouse, true, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	down.Complete(true)

	up, err := manual.ReserveWithCooldown(context.Background(), ManualRelativeMouse, false, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	up.Complete(true)

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
	}
	now = now.Add(2 * time.Second)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	release()
}

func TestCooldownAggregatesAcrossPendingReports(t *testing.T) {
	now := time.Unix(285, 0)
	coordinator := newCoordinator(time.Second, func() time.Time { return now })
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	move, err := manual.ReserveWithCooldown(context.Background(), ManualAbsoluteMouse, false, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	wheel, err := manual.ReserveWithCooldown(context.Background(), ManualAbsoluteMouse, false, true, nil)
	if err != nil {
		t.Fatal(err)
	}

	wheel.Complete(true)
	move.Complete(true)

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
	}
	now = now.Add(2 * time.Second)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	release()
}

func TestRelativeAndAbsoluteMouseHeldStateIsIndependent(t *testing.T) {
	now := time.Unix(300, 0)
	coordinator := newCoordinator(time.Second, func() time.Time { return now })
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	relativeDown, err := manual.Reserve(context.Background(), ManualRelativeMouse, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	relativeDown.Complete(true)

	absoluteMove, err := manual.Reserve(context.Background(), ManualAbsoluteMouse, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	absoluteMove.Complete(true)

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("relative button was cleared by absolute report: %v", err)
	}

	relativeUp, err := manual.Reserve(context.Background(), ManualRelativeMouse, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	relativeUp.Complete(true)

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
	}
	now = now.Add(2 * time.Second)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	release()
}

func TestAbsoluteMouseHeldStateSurvivesRelativeReport(t *testing.T) {
	coordinator := newCoordinator(defaultManualCooldown, time.Now)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	absoluteDown, err := manual.Reserve(context.Background(), ManualAbsoluteMouse, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	absoluteDown.Complete(true)

	relativeMove, err := manual.Reserve(context.Background(), ManualRelativeMouse, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	relativeMove.Complete(true)

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("absolute button was cleared by relative report: %v", err)
	}
}

func TestBlockedActiveSessionStillAllowsReleaseReport(t *testing.T) {
	coordinator := newCoordinator(defaultManualCooldown, time.Now)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	down, err := manual.Reserve(context.Background(), ManualKeyboard, true, func(controlmode.Mode) bool { return true })
	if err != nil {
		t.Fatal(err)
	}
	down.Complete(true)

	if _, err := manual.Reserve(context.Background(), ManualKeyboard, true, func(controlmode.Mode) bool { return false }); !errors.Is(err, ErrManualInputBlocked) {
		t.Fatalf("new held report error = %v, want %v", err, ErrManualInputBlocked)
	}

	up, err := manual.Reserve(context.Background(), ManualKeyboard, false, func(controlmode.Mode) bool { return false })
	if err != nil {
		t.Fatalf("release report was blocked: %v", err)
	}
	up.Complete(true)
}

func TestBlockedActiveSessionFailedReleaseClearsHeldReport(t *testing.T) {
	now := time.Unix(325, 0)
	coordinator := newCoordinator(time.Second, func() time.Time { return now })
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	down, err := manual.Reserve(context.Background(), ManualKeyboard, true, func(controlmode.Mode) bool { return true })
	if err != nil {
		t.Fatal(err)
	}
	down.Complete(true)

	if _, err := manual.Reserve(context.Background(), ManualKeyboard, true, func(controlmode.Mode) bool { return false }); !errors.Is(err, ErrManualInputBlocked) {
		t.Fatalf("new held report error = %v, want %v", err, ErrManualInputBlocked)
	}

	up, err := manual.Reserve(context.Background(), ManualKeyboard, false, func(controlmode.Mode) bool { return false })
	if err != nil {
		t.Fatalf("release report was blocked: %v", err)
	}
	up.Complete(false)

	if _, _, err := coordinator.BeginMCP(context.Background(), OperationHID); !errors.Is(err, ErrManualControlActive) {
		t.Fatalf("cooldown error = %v, want %v", err, ErrManualControlActive)
	}
	now = now.Add(2 * time.Second)
	_, release, err := coordinator.BeginMCP(context.Background(), OperationHID)
	if err != nil {
		t.Fatalf("failed blocked release report left held input active: %v", err)
	}
	release()
}

func TestReadOnlyMCPAllowedDuringManualControl(t *testing.T) {
	coordinator := newCoordinator(defaultManualCooldown, time.Now)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	manual := NewManualSession(control, coordinator)
	defer manual.Close()

	reservation, err := manual.Reserve(context.Background(), ManualRelativeMouse, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	reservation.Complete(true)

	_, release, err := coordinator.BeginMCP(context.Background(), OperationReadOnly)
	if err != nil {
		t.Fatalf("read-only MCP operation was blocked by manual control: %v", err)
	}
	release()
}

func TestManualWritesAreSerialized(t *testing.T) {
	coordinator := newCoordinator(defaultManualCooldown, time.Now)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	first := NewManualSession(control, coordinator)
	second := NewManualSession(control, coordinator)
	defer first.Close()
	defer second.Close()

	firstReservation, err := first.Reserve(context.Background(), ManualKeyboard, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	secondReservation, err := second.Reserve(context.Background(), ManualRelativeMouse, false, nil)
	if err != nil {
		t.Fatal(err)
	}

	entered := make(chan struct{})
	releaseFirst := make(chan struct{})
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		_ = first.Execute(func() error {
			close(entered)
			<-releaseFirst
			return nil
		})
		firstReservation.Complete(true)
	}()
	<-entered

	secondEntered := make(chan struct{})
	go func() {
		defer wg.Done()
		_ = second.Execute(func() error {
			close(secondEntered)
			return nil
		})
		secondReservation.Complete(true)
	}()
	select {
	case <-secondEntered:
		t.Fatal("second manual write entered before the first completed")
	case <-time.After(20 * time.Millisecond):
	}
	close(releaseFirst)
	wg.Wait()
}
