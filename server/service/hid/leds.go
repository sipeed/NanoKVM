package hid

import (
	"errors"
	"fmt"
	"os"
	"sync"
	"syscall"
	"time"

	log "github.com/sirupsen/logrus"
	"golang.org/x/sys/unix"
)

const (
	KeyboardLedStatusEvent = "hid-led-status"
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
		file, notifierFD := h.keyboardLedReaderHandles()
		if file == nil {
			if err := waitForKeyboardLedReaderChange(notifierFD); err != nil {
				log.Debugf("wait for keyboard LED reader failed: %s", err)
			}
			continue
		}

		changed, err := waitForKeyboardLedReportOrChange(file, notifierFD)
		if err != nil {
			if !errors.Is(err, os.ErrClosed) {
				log.Debugf("wait for keyboard LED report failed: %s", err)
			}
			h.reopenKeyboardLedReader(file)
			continue
		}
		if changed {
			continue
		}

		n, err := file.Read(buf)
		if n > 0 {
			// Both keyboard gadget descriptors in kvmapp/system/init.d declare
			// boot-keyboard reports without a Report ID (no 0x85 item). Their LED
			// output report is one byte: bits 0-4 are the LED bitmap and bits 5-7
			// are padding. report_length is 8 because it also covers input reports.
			keyboardLeds.Update(buf[0])
		}

		if err == nil && n > 0 {
			continue
		}
		if err != nil && !errors.Is(err, os.ErrClosed) {
			log.Debugf("read keyboard LED report failed: %s", err)
		}
		h.reopenKeyboardLedReader(file)
	}
}

func (h *Hid) keyboardLedReaderHandles() (*os.File, int) {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()
	if h.ledReaderNotifyReader == nil {
		return h.g0Reader, -1
	}
	return h.g0Reader, h.ledReaderNotifyReadFD
}

func (h *Hid) reopenKeyboardLedReader(file *os.File) {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()

	// A reset may have installed a new reader while the old descriptor was
	// reporting an error. Never let that stale reader close the replacement.
	if h.g0Reader != file {
		return
	}
	h.closeKeyboardLedReaderNoLock()
	if h.g0 == nil {
		return
	}
	if err := h.openKeyboardLedReaderNoLock(); err != nil {
		log.Debugf("reopen keyboard LED reader failed: %s", err)
	}
}

func (h *Hid) ensureKeyboardLedReaderNotifierNoLock() error {
	if h.ledReaderNotifyReader != nil {
		return nil
	}

	reader, writer, err := os.Pipe()
	if err != nil {
		return fmt.Errorf("create keyboard LED reader notifier: %w", err)
	}
	readerFD := int(reader.Fd())
	writerFD := int(writer.Fd())
	if err := unix.SetNonblock(readerFD, true); err != nil {
		_ = reader.Close()
		_ = writer.Close()
		return fmt.Errorf("set keyboard LED reader notifier read end nonblocking: %w", err)
	}
	if err := unix.SetNonblock(writerFD, true); err != nil {
		_ = reader.Close()
		_ = writer.Close()
		return fmt.Errorf("set keyboard LED reader notifier write end nonblocking: %w", err)
	}
	h.ledReaderNotifyReader = reader
	h.ledReaderNotifyWriter = writer
	h.ledReaderNotifyReadFD = readerFD
	h.ledReaderNotifyWriteFD = writerFD
	return nil
}

func (h *Hid) notifyKeyboardLedReaderNoLock() {
	if h.ledReaderNotifyWriter == nil {
		return
	}
	_, err := unix.Write(h.ledReaderNotifyWriteFD, []byte{1})
	if err != nil && !errors.Is(err, syscall.EAGAIN) && !errors.Is(err, syscall.EWOULDBLOCK) {
		log.Debugf("notify keyboard LED reader failed: %s", err)
	}
}

func waitForKeyboardLedReaderChange(notifierFD int) error {
	if notifierFD < 0 {
		return fmt.Errorf("keyboard LED reader notifier is nil")
	}
	_, err := unix.Poll([]unix.PollFd{{Fd: int32(notifierFD), Events: unix.POLLIN}}, -1)
	if err != nil {
		return err
	}
	drainKeyboardLedReaderNotifier(notifierFD)
	return nil
}

// waitForKeyboardLedReportOrChange blocks until a HID output report arrives or
// the reader is replaced/closed. Its bool result is true for the latter.
func waitForKeyboardLedReportOrChange(file *os.File, notifierFD int) (bool, error) {
	if file == nil || notifierFD < 0 {
		return false, fmt.Errorf("keyboard LED reader or notifier is nil")
	}

	fds := []unix.PollFd{
		{Fd: int32(file.Fd()), Events: unix.POLLIN},
		{Fd: int32(notifierFD), Events: unix.POLLIN},
	}
	_, err := unix.Poll(fds, -1)
	if err != nil {
		return false, err
	}
	if fds[1].Revents&unix.POLLIN != 0 {
		drainKeyboardLedReaderNotifier(notifierFD)
		return true, nil
	}
	if fds[0].Revents&(unix.POLLIN|unix.POLLERR|unix.POLLHUP|unix.POLLNVAL) != 0 {
		return false, nil
	}
	return false, fmt.Errorf("keyboard LED poll returned without an event")
}

func drainKeyboardLedReaderNotifier(notifierFD int) {
	buf := make([]byte, 64)
	for {
		_, err := unix.Read(notifierFD, buf)
		if err != nil {
			if !errors.Is(err, syscall.EAGAIN) && !errors.Is(err, syscall.EWOULDBLOCK) {
				log.Debugf("drain keyboard LED reader notifier failed: %s", err)
			}
			return
		}
	}
}
