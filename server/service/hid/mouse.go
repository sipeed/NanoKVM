package hid

import (
	log "github.com/sirupsen/logrus"
)

func (h *Hid) Mouse(queue <-chan []byte) {
	h.mouse(queue, HID1, HID2)
}

func (h *Hid) mouse(queue <-chan []byte, relativePath string, absolutePath string) {
	defer h.releaseRelativeMouse(relativePath)

	absoluteButtonsActive := false
	var absoluteReleaseReport []byte
	defer func() {
		if absoluteButtonsActive {
			h.releaseAbsoluteMouse(absolutePath, absoluteReleaseReport)
		}
	}()

	for event := range queue {
		switch len(event) {
		case 4:
			if !h.writeHIDReport(h.relativeMouseDevice(relativePath), event) {
				if dropped := drainHIDQueue(queue); dropped > 0 {
					log.Debugf("dropped %d stale mouse HID reports after relative write failure", dropped)
				}
				h.releaseRelativeMouse(relativePath)
			}
		case 6:
			if !h.writeHIDReport(h.absoluteMouseDevice(absolutePath), event) {
				if dropped := drainHIDQueue(queue); dropped > 0 {
					log.Debugf("dropped %d stale mouse HID reports after absolute write failure", dropped)
				}
				if absoluteButtonsActive {
					if h.releaseAbsoluteMouse(absolutePath, absoluteReleaseReport) {
						absoluteButtonsActive = false
					}
				} else if event[0] != 0 {
					h.releaseAbsoluteMouse(absolutePath, absoluteMouseReleaseReport(event))
				}
				continue
			}
			absoluteReleaseReport = absoluteMouseReleaseReport(event)
			absoluteButtonsActive = event[0] != 0
		default:
			log.Debugf("invalid mouse event: %v", event)
		}
	}
}

func (h *Hid) releaseRelativeMouse(path string) {
	h.writeHIDReport(h.relativeMouseDevice(path), relativeMouseReleaseReport())
}

func (h *Hid) releaseAbsoluteMouse(path string, report []byte) bool {
	return h.writeHIDReport(h.absoluteMouseDevice(path), report)
}

func relativeMouseReleaseReport() []byte {
	return []byte{0x00, 0x00, 0x00, 0x00}
}

func absoluteMouseReleaseReport(positionReport []byte) []byte {
	report := []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00}
	if len(positionReport) >= 5 {
		copy(report[1:5], positionReport[1:5])
	}
	return report
}
