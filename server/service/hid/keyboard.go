package hid

import (
	log "github.com/sirupsen/logrus"
)

func (h *Hid) Keyboard(queue <-chan []byte) {
	for event := range queue {
		if len(event) != 8 {
			log.Debugf("invalid keyboard event: %v", event)
			continue
		}

		h.WriteHid0(event)
	}
}
