package hid

import (
	"errors"
	"os"

	log "github.com/sirupsen/logrus"
)

func (h *Hid) OpenNoLock() {
	var err error
	h.CloseNoLock()

	h.g0, err = os.OpenFile("/dev/hidg0", os.O_WRONLY, 0o666)
	if err != nil {
		log.Errorf("open /dev/hidg0 failed: %s", err)
	}

	h.g1, err = os.OpenFile("/dev/hidg1", os.O_WRONLY, 0o666)
	if err != nil {
		log.Errorf("open /dev/hidg1 failed: %s", err)
	}

	h.g2, err = os.OpenFile("/dev/hidg2", os.O_WRONLY, 0o666)
	if err != nil {
		log.Errorf("open /dev/hidg2 failed: %s", err)
	}
}

func (h *Hid) Open() {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()
	h.mouseMutex.Lock()
	defer h.mouseMutex.Unlock()

	h.CloseNoLock()

	h.OpenNoLock()
}

func (h *Hid) CloseNoLock() {
	for _, file := range []*os.File{h.g0, h.g1, h.g2} {
		if file != nil {
			_ = file.Sync()
			_ = file.Close()
		}
	}
}

func (h *Hid) Close() {
	h.kbMutex.Lock()
	defer h.kbMutex.Unlock()
	h.mouseMutex.Lock()
	defer h.mouseMutex.Unlock()

	h.CloseNoLock()
}

func (h *Hid) Write(file *os.File, data []byte) {
	_, err := file.Write(data)
	if err != nil {
		if errors.Is(err, os.ErrClosed) {
			log.Debugf("hid already closed, reopen it...")
			h.Open()
		} else {
			log.Errorf("write to hid failed: %s", err)
		}

		return
	}

	log.Debugf("write to hid: %+v", data)
}
