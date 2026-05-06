package hid

import (
	log "github.com/sirupsen/logrus"
)

func (h *Hid) Keyboard(queue <-chan []byte) {
	h.keyboard(queue, HID0)
}

func (h *Hid) keyboard(queue <-chan []byte, path string) {
	defer h.releaseKeyboard(path)

	for event := range queue {
		if len(event) != 8 {
			log.Debugf("invalid keyboard event: %v", event)
			continue
		}

		if !h.writeHIDReport(h.keyboardDevice(path), event) {
			if dropped := drainHIDQueue(queue); dropped > 0 {
				log.Debugf("dropped %d stale keyboard HID reports after write failure", dropped)
			}
			h.releaseKeyboard(path)
		}
	}
}

func (h *Hid) releaseKeyboard(path string) {
	h.writeHIDReport(h.keyboardDevice(path), keyboardReleaseReport())
}

func keyboardReleaseReport() []byte {
	return []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}
}

func drainHIDQueue(queue <-chan []byte) int {
	dropped := 0
	for {
		select {
		case _, ok := <-queue:
			if !ok {
				return dropped
			}
			dropped++
		default:
			return dropped
		}
	}
}
