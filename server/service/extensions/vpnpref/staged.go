package vpnpref

import (
	"context"
	"sync"
)

var stagedInstalls = struct {
	sync.Mutex
	next    uint64
	pending map[uint64]context.CancelFunc
}{pending: make(map[uint64]context.CancelFunc)}

// BeginStagedInstall registers an install before slow I/O. Callers must hold
// the lifecycle lock when beginning, checking or invalidating an intent.
func BeginStagedInstall(parent context.Context) (context.Context, uint64, func()) {
	stagedInstalls.Lock()
	stagedInstalls.next++
	token := stagedInstalls.next
	ctx, cancel := context.WithCancel(parent)
	stagedInstalls.pending[token] = cancel
	stagedInstalls.Unlock()
	return ctx, token, func() {
		cancel()
		stagedInstalls.Lock()
		delete(stagedInstalls.pending, token)
		stagedInstalls.Unlock()
	}
}

func StagedInstallCurrent(token uint64) bool {
	stagedInstalls.Lock()
	defer stagedInstalls.Unlock()
	_, ok := stagedInstalls.pending[token]
	return ok
}

// InvalidateStagedInstalls orders a newer lifecycle action after all pending
// downloads. Rejected busy actions must not call this method.
func InvalidateStagedInstalls() {
	InvalidateOtherStagedInstalls(0)
}

// InvalidateOtherStagedInstalls preserves the intent being promoted.
func InvalidateOtherStagedInstalls(current uint64) {
	stagedInstalls.Lock()
	defer stagedInstalls.Unlock()
	for token, cancel := range stagedInstalls.pending {
		if token == current {
			continue
		}
		cancel()
		delete(stagedInstalls.pending, token)
	}
}
