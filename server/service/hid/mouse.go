package hid

import (
	log "github.com/sirupsen/logrus"
)

func (h *Hid) Mouse(queue <-chan []byte) {
	for event := range queue {
		switch len(event) {
		case 4:
			h.WriteHid1(event)
		case 6:
			h.WriteHid2(event)
		default:
			log.Debugf("invalid mouse event: %v", event)
		}
	}
}
