package hdmi_state

import (
	"sync"
	"testing"
	"time"
)

func TestUpdateViewerIgnoresOlderSnapshot(t *testing.T) {
	state := New()
	if !state.UpdateViewer("direct", 1, 2) {
		t.Fatal("new snapshot was rejected")
	}
	if state.UpdateViewer("direct", 0, 1) {
		t.Fatal("older snapshot was accepted")
	}

	count, version, ok := state.Viewer("direct")
	if !ok || count != 1 || version != 2 || state.ViewerCount() != 1 {
		t.Fatalf("viewer=(%d,%d,%t) total=%d", count, version, ok, state.ViewerCount())
	}
}

func TestCaptureReadyAtTracksWarmup(t *testing.T) {
	state := New()
	readyAt := time.Now().Add(time.Second)
	state.MarkWarming(readyAt)
	if got := state.ReadyAt(); !got.Equal(readyAt) {
		t.Fatalf("readyAt=%v, want %v", got, readyAt)
	}
	if !state.NeedsFreshFrame() {
		t.Fatal("warmup did not require a fresh frame")
	}
	if !state.ClaimFreshFrame() {
		t.Fatal("fresh frame was not claimed")
	}
	if state.NeedsFreshFrame() || state.ClaimFreshFrame() {
		t.Fatal("fresh frame requirement was not cleared after the first claim")
	}
	state.MarkWarming(readyAt)
	state.ClearReadyAt()
	if !state.ReadyAt().IsZero() || state.NeedsFreshFrame() {
		t.Fatalf("readyAt=%v needsFresh=%t, want zero/false", state.ReadyAt(), state.NeedsFreshFrame())
	}
}

func TestClaimFreshFrameOnlySucceedsOnce(t *testing.T) {
	state := New()
	state.MarkWarming(time.Now())

	if !state.ClaimFreshFrame() {
		t.Fatal("first reader did not claim the fresh frame")
	}
	if state.ClaimFreshFrame() {
		t.Fatal("second reader claimed the same fresh frame")
	}
}

func TestLeasesKeepCaptureDemandActive(t *testing.T) {
	state := New()
	state.AcquireLease()
	state.AcquireLease()
	if !state.HasDemand() || state.LeaseCount() != 2 {
		t.Fatalf("demand=%t leases=%d", state.HasDemand(), state.LeaseCount())
	}
	if !state.ReleaseLease() || !state.HasDemand() {
		t.Fatal("first lease release cleared demand")
	}
	if !state.ReleaseLease() || state.HasDemand() {
		t.Fatal("last lease release did not clear demand")
	}
	if state.ReleaseLease() {
		t.Fatal("release accepted after all leases were released")
	}
}

func TestConcurrentSourceReportsLeaveLatestSnapshot(t *testing.T) {
	state := New()
	var mutex sync.Mutex
	var wait sync.WaitGroup
	for version := uint64(1); version <= 100; version++ {
		wait.Add(1)
		go func(version uint64) {
			defer wait.Done()
			mutex.Lock()
			state.UpdateViewer("webrtc", int(version%2), version)
			mutex.Unlock()
		}(version)
	}
	wait.Wait()

	mutex.Lock()
	_, version, ok := state.Viewer("webrtc")
	mutex.Unlock()
	if !ok || version != 100 {
		t.Fatalf("version=%d exists=%t, want 100/true", version, ok)
	}
}
