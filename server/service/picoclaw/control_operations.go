package picoclaw

import (
	"context"
	"errors"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	maxControlOperationDuration = 35 * time.Second
	maxWaitDurationMS           = 30_000
)

var (
	errControlModeSwitch = errors.New("PicoClaw control operation canceled by control mode switch")
	errControlTimeout    = errors.New("PicoClaw control operation timed out")
)

type controlOperationTracker struct {
	mu     sync.Mutex
	nextID uint64
	active map[uint64]context.CancelCauseFunc
}

func newControlOperationTracker() *controlOperationTracker {
	return &controlOperationTracker{active: make(map[uint64]context.CancelCauseFunc)}
}

func (t *controlOperationTracker) begin(parent context.Context) (context.Context, func()) {
	if parent == nil {
		parent = context.Background()
	}
	if t == nil {
		return parent, func() {}
	}

	ctx, cancel := context.WithCancelCause(parent)
	t.mu.Lock()
	if t.active == nil {
		t.active = make(map[uint64]context.CancelCauseFunc)
	}
	t.nextID++
	id := t.nextID
	t.active[id] = cancel
	t.mu.Unlock()

	var once sync.Once
	release := func() {
		once.Do(func() {
			cancel(context.Canceled)
			t.mu.Lock()
			delete(t.active, id)
			t.mu.Unlock()
		})
	}
	return ctx, release
}

func (t *controlOperationTracker) cancelAll(cause error) int {
	if t == nil {
		return 0
	}
	if cause == nil {
		cause = context.Canceled
	}

	t.mu.Lock()
	cancels := make([]context.CancelCauseFunc, 0, len(t.active))
	for _, cancel := range t.active {
		cancels = append(cancels, cancel)
	}
	t.mu.Unlock()

	for _, cancel := range cancels {
		cancel(cause)
	}
	return len(cancels)
}

func (s *Service) beginControlOperation(parent context.Context) (context.Context, func()) {
	if parent == nil {
		parent = context.Background()
	}

	timedCtx, cancelTimeout := context.WithTimeoutCause(
		parent,
		maxControlOperationDuration,
		errControlTimeout,
	)
	if s == nil || s.operations == nil {
		return timedCtx, cancelTimeout
	}

	operationCtx, releaseOperation := s.operations.begin(timedCtx)
	var once sync.Once
	return operationCtx, func() {
		once.Do(func() {
			releaseOperation()
			cancelTimeout()
		})
	}
}

func (s *Service) beginRuntimeLifecycleOperation(parent context.Context) (context.Context, func()) {
	if parent == nil {
		parent = context.Background()
	}
	if s == nil || s.operations == nil {
		ctx, cancel := context.WithCancelCause(parent)
		return ctx, func() { cancel(context.Canceled) }
	}
	return s.operations.begin(parent)
}

func (s *Service) CancelActiveControlOperations() int {
	if s == nil || s.operations == nil {
		return 0
	}
	count := s.operations.cancelAll(errControlModeSwitch)
	log.WithFields(log.Fields{
		"active_operations": count,
	}).Info("picoclaw control operations canceled for control mode switch")
	return count
}

func runtimeLifecycleOperationError(ctx context.Context) *PicoclawError {
	if ctx == nil || ctx.Err() == nil {
		return nil
	}

	cause := context.Cause(ctx)
	switch {
	case errors.Is(cause, errControlModeSwitch):
		return newPicoclawError(CodeControlModeConflict, "PicoClaw runtime lifecycle canceled because the control mode is switching")
	case errors.Is(cause, context.DeadlineExceeded):
		return newPicoclawError(CodeRuntimeUnavailable, "PicoClaw runtime lifecycle timed out")
	default:
		return newPicoclawError(CodeRuntimeUnavailable, "PicoClaw runtime lifecycle was canceled")
	}
}

func controlOperationError(ctx context.Context) *PicoclawError {
	if ctx == nil || ctx.Err() == nil {
		return nil
	}

	cause := context.Cause(ctx)
	switch {
	case errors.Is(cause, errControlModeSwitch):
		return newPicoclawError(CodeControlModeConflict, "PicoClaw control operation canceled because the control mode is switching")
	case errors.Is(cause, errControlTimeout), errors.Is(cause, context.DeadlineExceeded):
		return newPicoclawError(CodeInvalidAction, "PicoClaw control operation exceeded the 35 second limit")
	default:
		return newPicoclawError(CodeInvalidAction, "PicoClaw control operation was canceled")
	}
}

func waitForControlOperation(ctx context.Context, delay time.Duration) *PicoclawError {
	if ctx == nil {
		ctx = context.Background()
	}
	if err := controlOperationError(ctx); err != nil {
		return err
	}
	if delay <= 0 {
		return nil
	}

	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return controlOperationError(ctx)
	case <-timer.C:
		return nil
	}
}
