package hid

import (
	"testing"
	"time"
)

func TestKeyboardLedStatusFromReport(t *testing.T) {
	updatedAt := time.Date(2026, time.July, 24, 12, 0, 0, 0, time.UTC)
	status := keyboardLedStatusFromReport(0x17, updatedAt)

	if !status.NumLock || !status.CapsLock || !status.ScrollLock || !status.Known {
		t.Fatalf("unexpected parsed status: %+v", status)
	}
	if !status.UpdatedAt.Equal(updatedAt) {
		t.Fatalf("updatedAt = %s, want %s", status.UpdatedAt, updatedAt)
	}
}

func TestKeyboardLedStatusStoreOnlyNotifiesStateChanges(t *testing.T) {
	now := time.Date(2026, time.July, 24, 12, 0, 0, 0, time.UTC)
	store := newKeyboardLedStatusStore(func() time.Time { return now })
	notifications := make(chan KeyboardLedStatus, 2)
	store.Subscribe(func(status KeyboardLedStatus) {
		notifications <- status
	})

	store.Update(0x01)
	store.Update(0x01)
	now = now.Add(time.Second)
	store.Update(0x03)

	first := <-notifications
	second := <-notifications
	if !first.NumLock || first.CapsLock || !second.NumLock || !second.CapsLock {
		t.Fatalf("unexpected notifications: first=%+v second=%+v", first, second)
	}

	select {
	case status := <-notifications:
		t.Fatalf("unexpected duplicate notification: %+v", status)
	default:
	}

	if status := store.Get(); !status.UpdatedAt.Equal(now) {
		t.Fatalf("latest updatedAt = %s, want %s", status.UpdatedAt, now)
	}
}
