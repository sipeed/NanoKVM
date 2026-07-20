package controlmode

import (
	"errors"
	"sync"
	"time"
)

var ErrActivityWaitTimeout = errors.New("timed out waiting for active control operations")

// activityGate allows normal control operations to share the current mode while
// giving mode transitions exclusive access. Unlike sync.RWMutex, exclusive
// acquisition is bounded so an abandoned client cannot leave the manager stuck
// in the transitioning state forever.
type activityGate struct {
	mu        sync.Mutex
	active    int
	exclusive bool
	changed   chan struct{}
}

func (g *activityGate) acquireShared() func() {
	for {
		g.mu.Lock()
		if !g.exclusive {
			g.active++
			g.mu.Unlock()

			var once sync.Once
			return func() {
				once.Do(func() {
					g.mu.Lock()
					if g.active > 0 {
						g.active--
					}
					g.signalLocked()
					g.mu.Unlock()
				})
			}
		}

		changed := g.changedLocked()
		g.mu.Unlock()
		<-changed
	}
}

func (g *activityGate) acquireExclusive(timeout time.Duration) (func(), error) {
	if timeout <= 0 {
		return nil, ErrActivityWaitTimeout
	}

	timer := time.NewTimer(timeout)
	defer timer.Stop()

	for {
		g.mu.Lock()
		if !g.exclusive && g.active == 0 {
			g.exclusive = true
			g.mu.Unlock()

			var once sync.Once
			return func() {
				once.Do(func() {
					g.mu.Lock()
					g.exclusive = false
					g.signalLocked()
					g.mu.Unlock()
				})
			}, nil
		}

		changed := g.changedLocked()
		g.mu.Unlock()

		select {
		case <-changed:
		case <-timer.C:
			return nil, ErrActivityWaitTimeout
		}
	}
}

func (g *activityGate) changedLocked() <-chan struct{} {
	if g.changed == nil {
		g.changed = make(chan struct{})
	}
	return g.changed
}

func (g *activityGate) signalLocked() {
	if g.changed == nil {
		return
	}
	close(g.changed)
	g.changed = make(chan struct{})
}
