package hid

import (
	"errors"
	"fmt"
	"io"
	"os"
	"sync"
	"syscall"
	"time"

	log "github.com/sirupsen/logrus"
)

type Hid struct {
	g0         *os.File
	g1         *os.File
	g2         *os.File
	kbMutex    sync.Mutex
	mouseMutex sync.Mutex
}

const (
	HID0 = "/dev/hidg0" // Keyboard
	HID1 = "/dev/hidg1" // Mouse (Relative Mode)
	HID2 = "/dev/hidg2" // Touchpad (Absolute Mode)
)

const (
	hidWriteTimeout     = 50 * time.Millisecond
	hidWriteRetryDelay  = time.Millisecond
	hidReopenTimeout    = 2 * time.Second
	hidReopenRetryDelay = 100 * time.Millisecond
)

type hidWriter interface {
	Write([]byte) (int, error)
}

type hidDevice struct {
	path string
	mu   *sync.Mutex
	get  func() *os.File
	set  func(*os.File)
}

var (
	hid     *Hid
	hidOnce sync.Once
)

func GetHid() *Hid {
	hidOnce.Do(func() {
		hid = &Hid{}
	})
	return hid
}

func (h *Hid) Lock() {
	h.kbMutex.Lock()
	h.mouseMutex.Lock()
}

func (h *Hid) Unlock() {
	h.kbMutex.Unlock()
	h.mouseMutex.Unlock()
}

func (h *Hid) keyboardDevice(path string) hidDevice {
	return hidDevice{
		path: path,
		mu:   &h.kbMutex,
		get: func() *os.File {
			return h.g0
		},
		set: func(file *os.File) {
			h.g0 = file
		},
	}
}

func (h *Hid) relativeMouseDevice(path string) hidDevice {
	return hidDevice{
		path: path,
		mu:   &h.mouseMutex,
		get: func() *os.File {
			return h.g1
		},
		set: func(file *os.File) {
			h.g1 = file
		},
	}
}

func (h *Hid) absoluteMouseDevice(path string) hidDevice {
	return hidDevice{
		path: path,
		mu:   &h.mouseMutex,
		get: func() *os.File {
			return h.g2
		},
		set: func(file *os.File) {
			h.g2 = file
		},
	}
}

func (h *Hid) devices() []hidDevice {
	return []hidDevice{
		h.keyboardDevice(HID0),
		h.relativeMouseDevice(HID1),
		h.absoluteMouseDevice(HID2),
	}
}

func (h *Hid) OpenNoLock() error {
	h.CloseNoLock()

	var errs []error
	for _, device := range h.devices() {
		if err := h.openDeviceNoLock(device); err != nil {
			log.Errorf("open %s failed: %s", device.path, err)
			errs = append(errs, err)
		}
	}

	return errors.Join(errs...)
}

func (h *Hid) OpenNoLockWithRetry(timeout, delay time.Duration) error {
	return openNoLockWithRetry(h.OpenNoLock, timeout, delay)
}

func openNoLockWithRetry(open func() error, timeout, delay time.Duration) error {
	if timeout <= 0 {
		return open()
	}
	if delay <= 0 {
		delay = hidReopenRetryDelay
	}

	deadline := time.Now().Add(timeout)
	var lastErr error
	for {
		if err := open(); err != nil {
			lastErr = err
		} else {
			return nil
		}

		remaining := time.Until(deadline)
		if remaining <= 0 {
			break
		}
		if remaining > delay {
			remaining = delay
		}
		time.Sleep(remaining)
	}

	return fmt.Errorf("open HID devices within %s: %w", timeout, lastErr)
}

func (h *Hid) CloseNoLock() {
	for _, device := range h.devices() {
		h.closeDeviceNoLock(device)
	}
}

func (h *Hid) openDeviceNoLock(device hidDevice) error {
	if device.get() != nil {
		return nil
	}

	file, err := os.OpenFile(device.path, os.O_WRONLY|syscall.O_NONBLOCK, 0o666)
	if err != nil {
		return fmt.Errorf("%s: %w", device.path, err)
	}

	device.set(file)
	return nil
}

func (h *Hid) closeDeviceNoLock(device hidDevice) {
	file := device.get()
	if file == nil {
		return
	}

	device.set(nil)
	if err := file.Close(); err != nil {
		log.Debugf("close %s failed: %s", device.path, err)
	}
}

// writeWithTimeout bounds how long callers hold HID locks when writing to a
// nonblocking descriptor. EAGAIN means the host is not accepting HID reports
// yet, so retry until the caller's deadline expires.
func writeWithTimeout(writer hidWriter, data []byte, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)

	for {
		n, err := writer.Write(data)
		if err == nil {
			if n != len(data) {
				return io.ErrShortWrite
			}
			return nil
		}

		if n != 0 {
			return io.ErrShortWrite
		}
		if !isRetryableWriteError(err) {
			return err
		}

		remaining := time.Until(deadline)
		if timeout <= 0 || remaining <= 0 {
			return os.ErrDeadlineExceeded
		}
		if remaining > hidWriteRetryDelay {
			remaining = hidWriteRetryDelay
		}
		time.Sleep(remaining)
	}
}

func isRetryableWriteError(err error) bool {
	return errors.Is(err, syscall.EAGAIN) || errors.Is(err, syscall.EWOULDBLOCK)
}

func (h *Hid) Open() {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()
	h.mouseMutex.Lock()
	defer h.mouseMutex.Unlock()

	h.OpenNoLock()
}

func (h *Hid) Close() {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()
	h.mouseMutex.Lock()
	defer h.mouseMutex.Unlock()

	h.CloseNoLock()
}

func (h *Hid) WriteHid0(data []byte) {
	h.writeHIDReport(h.keyboardDevice(HID0), data)
}

func (h *Hid) WriteHid1(data []byte) {
	h.writeHIDReport(h.relativeMouseDevice(HID1), data)
}

func (h *Hid) WriteHid2(data []byte) {
	h.writeHIDReport(h.absoluteMouseDevice(HID2), data)
}

func (h *Hid) writeHIDReport(device hidDevice, data []byte) bool {
	if err := h.writeHID(device, data); err != nil {
		log.Errorf("write to %s failed: %s", device.path, err)
		return false
	}
	return true
}

func (h *Hid) writeHID(device hidDevice, data []byte) error {
	device.mu.Lock()
	defer device.mu.Unlock()

	if err := h.openDeviceNoLock(device); err != nil {
		return err
	}

	file := device.get()
	if file == nil {
		return fmt.Errorf("%s: hid handle is nil", device.path)
	}

	deadline := time.Now().Add(hidWriteTimeout)
	if err := file.SetWriteDeadline(deadline); err != nil {
		log.Debugf("set write deadline for %s failed: %s", device.path, err)
	}

	if err := writeWithTimeout(file, data, hidWriteTimeout); err != nil {
		h.closeDeviceNoLock(device)
		switch {
		case errors.Is(err, os.ErrClosed):
			return fmt.Errorf("hid already closed: %w", err)
		case errors.Is(err, os.ErrDeadlineExceeded):
			return fmt.Errorf("timeout after %s: %w", hidWriteTimeout, err)
		default:
			return err
		}
	}

	log.Debugf("write to %s: %v", device.path, data)
	return nil
}
