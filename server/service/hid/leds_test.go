package hid

import (
	"os"
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

func TestWaitForKeyboardLedReaderChangeWaitsForNotification(t *testing.T) {
	h := &Hid{}
	h.kbMutex.Lock()
	if err := h.ensureKeyboardLedReaderNotifierNoLock(); err != nil {
		h.kbMutex.Unlock()
		t.Fatal(err)
	}
	notifierFD := h.ledReaderNotifyReadFD
	h.kbMutex.Unlock()
	defer h.ledReaderNotifyReader.Close()
	defer h.ledReaderNotifyWriter.Close()

	done := make(chan error, 1)
	go func() { done <- waitForKeyboardLedReaderChange(notifierFD) }()

	select {
	case err := <-done:
		t.Fatalf("wait returned before a notification: %v", err)
	case <-time.After(25 * time.Millisecond):
	}

	h.kbMutex.Lock()
	h.notifyKeyboardLedReaderNoLock()
	h.kbMutex.Unlock()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("wait returned error: %v", err)
		}
	case <-time.After(time.Second):
		t.Fatal("wait did not wake after a notification")
	}
}

func TestWaitForKeyboardLedReportOrChangeReturnsForReport(t *testing.T) {
	reader, writer, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer reader.Close()
	defer writer.Close()

	h := &Hid{}
	h.kbMutex.Lock()
	if err := h.ensureKeyboardLedReaderNotifierNoLock(); err != nil {
		h.kbMutex.Unlock()
		t.Fatal(err)
	}
	notifierFD := h.ledReaderNotifyReadFD
	h.kbMutex.Unlock()
	defer h.ledReaderNotifyReader.Close()
	defer h.ledReaderNotifyWriter.Close()

	done := make(chan struct {
		changed bool
		err     error
	}, 1)
	go func() {
		changed, err := waitForKeyboardLedReportOrChange(reader, notifierFD)
		done <- struct {
			changed bool
			err     error
		}{changed, err}
	}()

	if _, err := writer.Write([]byte{0x03}); err != nil {
		t.Fatal(err)
	}

	select {
	case result := <-done:
		if result.err != nil || result.changed {
			t.Fatalf("result = changed=%t, err=%v; want report", result.changed, result.err)
		}
	case <-time.After(time.Second):
		t.Fatal("wait did not wake for report")
	}
}

func TestReopenKeyboardLedReaderDoesNotCloseReplacement(t *testing.T) {
	oldReader, oldWriter, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer oldReader.Close()
	defer oldWriter.Close()
	replacement, replacementWriter, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer replacement.Close()
	defer replacementWriter.Close()

	h := &Hid{g0Reader: oldReader}
	h.kbMutex.Lock()
	if err := h.ensureKeyboardLedReaderNotifierNoLock(); err != nil {
		h.kbMutex.Unlock()
		t.Fatal(err)
	}
	h.g0Reader = replacement // Simulate reset/reopen replacing the reader.
	h.kbMutex.Unlock()
	defer h.ledReaderNotifyReader.Close()
	defer h.ledReaderNotifyWriter.Close()

	h.reopenKeyboardLedReader(oldReader)
	current, _ := h.keyboardLedReaderHandles()
	if current != replacement {
		t.Fatal("stale reader close replaced the active reader")
	}
	if _, err := replacementWriter.Write([]byte{0x01}); err != nil {
		t.Fatalf("replacement reader was closed: %v", err)
	}
	buf := make([]byte, 1)
	if _, err := replacement.Read(buf); err != nil {
		t.Fatalf("replacement reader was closed: %v", err)
	}
}
