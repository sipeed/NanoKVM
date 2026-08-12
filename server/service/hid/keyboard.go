package hid

import (
	log "github.com/sirupsen/logrus"
)

func (h *Hid) Keyboard(queue <-chan []byte) {
	legacy := make(chan QueuedReport)
	go func() {
		defer close(legacy)
		for report := range queue {
			legacy <- QueuedReport{Data: report}
		}
	}()
	h.KeyboardReports(legacy)
}

func (h *Hid) KeyboardReports(queue <-chan QueuedReport) {
	h.keyboardReports(queue, HID0)
}

func (h *Hid) keyboardReports(queue <-chan QueuedReport, path string) {
	var execute func(func() error) error
	var resetKeyboard func()
	keyboardActive := false
	defer func() {
		if !keyboardActive {
			return
		}
		if err := runCleanup(execute, func() error {
			return h.writeHID(h.keyboardDevice(path), keyboardReleaseReport())
		}); err != nil {
			log.Errorf("release keyboard on queue close failed: %s", err)
			return
		}
		if resetKeyboard != nil {
			resetKeyboard()
		}
	}()

	for event := range queue {
		execute = event.Execute
		resetKeyboard = event.ResetKeyboard
		if len(event.Data) != 8 {
			event.complete(false)
			log.Debugf("invalid keyboard event: %v", event.Data)
			continue
		}

		if err := event.run(func() error {
			return h.writeHID(h.keyboardDevice(path), event.Data)
		}); err != nil {
			log.Errorf("write to %s failed: %s", path, err)
			if dropped := drainHIDQueue(queue); dropped > 0 {
				log.Debugf("dropped %d stale keyboard HID reports after write failure", dropped)
			}
			cleanupErr := runCleanup(execute, func() error {
				return h.writeHID(h.keyboardDevice(path), keyboardReleaseReport())
			})
			if cleanupErr != nil {
				log.Errorf("release keyboard after write failure failed: %s", cleanupErr)
				keyboardActive = keyboardActive || keyboardReportActive(event.Data)
				event.complete(false)
				continue
			}
			keyboardActive = false
			if resetKeyboard != nil {
				resetKeyboard()
			}
			event.complete(false)
			continue
		}

		keyboardActive = keyboardReportActive(event.Data)
		event.complete(true)
	}
}

func keyboardReportActive(report []byte) bool {
	if len(report) != 8 {
		return false
	}
	if report[0] != 0 {
		return true
	}
	for _, key := range report[2:] {
		if key != 0 {
			return true
		}
	}
	return false
}

func keyboardReleaseReport() []byte {
	return []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}
}

func drainHIDQueue(queue <-chan QueuedReport) int {
	dropped := 0
	for {
		select {
		case report, ok := <-queue:
			if !ok {
				return dropped
			}
			report.complete(false)
			dropped++
		default:
			return dropped
		}
	}
}
