package picoclaw

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"NanoKVM-Server/service/controlmode"
)

func TestControlModeSwitchCancelsActiveWait(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	service := &Service{
		control:    control,
		operations: newControlOperationTracker(),
	}

	operationCtx, releaseOperation := service.beginControlOperation(context.Background())
	releaseMode, modeErr := service.acquireControlMode()
	if modeErr != nil {
		t.Fatal(modeErr)
	}

	actionStarted := make(chan struct{})
	actionDone := make(chan *PicoclawError, 1)
	go func() {
		close(actionStarted)
		_, actionErr := service.executeAction(operationCtx, Action{
			Action:     "wait",
			DurationMs: maxWaitDurationMS,
		})
		releaseMode()
		releaseOperation()
		actionDone <- actionErr
	}()
	<-actionStarted

	switchDone := make(chan error, 1)
	go func() {
		switchDone <- control.Switch(controlmode.ModeMCP, func() error {
			service.CancelActiveControlOperations()
			return nil
		})
	}()

	select {
	case err := <-switchDone:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(time.Second):
		t.Fatal("control mode switch did not cancel the active PicoClaw wait")
	}

	select {
	case actionErr := <-actionDone:
		if actionErr == nil || actionErr.Code != CodeControlModeConflict {
			t.Fatalf("action error = %+v, want %s", actionErr, CodeControlModeConflict)
		}
	case <-time.After(time.Second):
		t.Fatal("canceled PicoClaw action did not return")
	}

	if got := control.Current(); got != controlmode.ModeMCP {
		t.Fatalf("mode = %q, want %q", got, controlmode.ModeMCP)
	}
}

func TestControlModeSwitchCancelsRuntimeLifecycle(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	service := &Service{
		control:    control,
		operations: newControlOperationTracker(),
	}

	operationCtx, releaseOperation := service.beginRuntimeLifecycleOperation(context.Background())
	releaseMode, modeErr := service.acquireControlMode()
	if modeErr != nil {
		t.Fatal(modeErr)
	}

	lifecycleDone := make(chan *PicoclawError, 1)
	go func() {
		<-operationCtx.Done()
		lifecycleErr := runtimeLifecycleOperationError(operationCtx)
		releaseOperation()
		releaseMode()
		lifecycleDone <- lifecycleErr
	}()

	switchDone := make(chan error, 1)
	go func() {
		switchDone <- control.Switch(controlmode.ModeMCP, func() error {
			service.CancelActiveControlOperations()
			return nil
		})
	}()

	select {
	case err := <-switchDone:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(time.Second):
		t.Fatal("control mode switch did not cancel the runtime lifecycle operation")
	}

	select {
	case lifecycleErr := <-lifecycleDone:
		if lifecycleErr == nil || lifecycleErr.Code != CodeControlModeConflict {
			t.Fatalf("lifecycle error = %+v, want %s", lifecycleErr, CodeControlModeConflict)
		}
	case <-time.After(time.Second):
		t.Fatal("canceled runtime lifecycle operation did not return")
	}

	if got := control.Current(); got != controlmode.ModeMCP {
		t.Fatalf("mode = %q, want %q", got, controlmode.ModeMCP)
	}
}

func TestRuntimeReadyWaitHonorsLifecycleCancellation(t *testing.T) {
	service := &Service{}
	ctx, cancel := context.WithCancelCause(context.Background())
	cancel(errControlModeSwitch)

	err := service.waitForRuntimeReadyContext(ctx, time.Hour)
	if err == nil || err.Code != CodeControlModeConflict {
		t.Fatalf("error = %+v, want %s", err, CodeControlModeConflict)
	}
}

func TestWaitDurationIsBounded(t *testing.T) {
	service := &Service{}
	_, err := service.executeAction(context.Background(), Action{
		Action:     "wait",
		DurationMs: maxWaitDurationMS + 1,
	})
	if err == nil || err.Code != CodeInvalidAction {
		t.Fatalf("error = %+v, want %s", err, CodeInvalidAction)
	}
}
