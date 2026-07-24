package hid

import (
	"errors"
	"os"
	"sync"
	"syscall"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	KeyboardLedStatusEvent = "hid-led-status"
	keyboardLedReadDelay   = 10 * time.Millisecond
)

// KeyboardLedStatus is the lock-key LED state last reported by the remote host
// through the keyboard HID output report.
type KeyboardLedStatus struct {
	NumLock    bool      `json:"numLock"`
	CapsLock   bool      `json:"capsLock"`
	ScrollLock bool      `json:"scrollLock"`
	Known      bool      `json:"known"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type keyboardLedStatusStore struct {
	mutex       sync.RWMutex
	status      KeyboardLedStatus
	subscribers map[int]func(KeyboardLedStatus)
	nextID      int
	now         func() time.Time
}

var keyboardLeds = newKeyboardLedStatusStore(time.Now)

func newKeyboardLedStatusStore(now func() time.Time) *keyboardLedStatusStore {
	return &keyboardLedStatusStore{
		subscribers: make(map[int]func(KeyboardLedStatus)),
		now:         now,
	}
}

// GetKeyboardLedStatus returns a snapshot. Known is false until the host has
// sent at least one keyboard HID output report.
func GetKeyboardLedStatus() KeyboardLedStatus {
	return keyboardLeds.Get()
}

// SubscribeKeyboardLedStatus subscribes to state changes and returns a
// function that removes the subscription.
func SubscribeKeyboardLedStatus(subscriber func(KeyboardLedStatus)) func() {
	return keyboardLeds.Subscribe(subscriber)
}

func (s *keyboardLedStatusStore) Get() KeyboardLedStatus {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.status
}

func (s *keyboardLedStatusStore) Subscribe(subscriber func(KeyboardLedStatus)) func() {
	s.mutex.Lock()
	id := s.nextID
	s.nextID++
	s.subscribers[id] = subscriber
	s.mutex.Unlock()

	return func() {
		s.mutex.Lock()
		delete(s.subscribers, id)
		s.mutex.Unlock()
	}
}

func (s *keyboardLedStatusStore) Update(report byte) {
	next := keyboardLedStatusFromReport(report, s.now())

	s.mutex.Lock()
	previous := s.status
	s.status = next
	if sameKeyboardLedState(previous, next) {
		s.mutex.Unlock()
		return
	}

	subscribers := make([]func(KeyboardLedStatus), 0, len(s.subscribers))
	for _, subscriber := range s.subscribers {
		subscribers = append(subscribers, subscriber)
	}
	s.mutex.Unlock()

	for _, subscriber := range subscribers {
		subscriber(next)
	}
}

func keyboardLedStatusFromReport(report byte, updatedAt time.Time) KeyboardLedStatus {
	return KeyboardLedStatus{
		NumLock:    report&0x01 != 0,
		CapsLock:   report&0x02 != 0,
		ScrollLock: report&0x04 != 0,
		Known:      true,
		UpdatedAt:  updatedAt,
	}
}

func sameKeyboardLedState(a, b KeyboardLedStatus) bool {
	return a.NumLock == b.NumLock &&
		a.CapsLock == b.CapsLock &&
		a.ScrollLock == b.ScrollLock &&
		a.Known == b.Known
}

func (h *Hid) startKeyboardLedReader() {
	h.ledReaderStartOnce.Do(func() {
		go h.readKeyboardLeds()
	})
}

func (h *Hid) readKeyboardLeds() {
	buf := make([]byte, 64)

	for {
		file := h.keyboardLedReader()
		if file == nil {
			time.Sleep(keyboardLedReadDelay)
			continue
		}

		n, err := file.Read(buf)
		if n > 0 {
			// The HID descriptor has one-byte LED output reports. report_length
			// is larger because it also covers keyboard input reports, so only
			// the first byte of each read is an LED bitmap.
			keyboardLeds.Update(buf[0])
		}

		if err == nil && n > 0 {
			continue
		}
		if err == nil || errors.Is(err, syscall.EAGAIN) || errors.Is(err, syscall.EWOULDBLOCK) {
			time.Sleep(keyboardLedReadDelay)
			continue
		}
		if errors.Is(err, os.ErrClosed) {
			time.Sleep(keyboardLedReadDelay)
			continue
		}

		log.Debugf("read keyboard LED report failed: %s", err)
		h.closeKeyboardLedReader(file)
		time.Sleep(keyboardLedReadDelay)
	}
}

func (h *Hid) keyboardLedReader() *os.File {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()
	return h.g0Reader
}

func (h *Hid) closeKeyboardLedReader(file *os.File) {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()

	if h.g0Reader == file {
		h.closeKeyboardLedReaderNoLock()
	}
}
