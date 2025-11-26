package hid

import (
	"encoding/binary"

	log "github.com/sirupsen/logrus"
)

const (
	MouseUp = iota
	MouseDown
	MouseMoveAbsolute
	MouseMoveRelative
	MouseScroll
)

var mouseButtonMap = map[byte]bool{
	0x01: true,
	0x02: true,
	0x04: true,
}

func (h *Hid) Mouse(queue <-chan []int) {
	for event := range queue {

		switch event[0] {
		case MouseDown:
			h.mouseDown(event)
		case MouseUp:
			h.mouseUp()
		case MouseMoveAbsolute:
			h.mouseMoveAbsolute(event)
		case MouseMoveRelative:
			h.mouseMoveRelative(event)
		case MouseScroll:
			h.mouseScroll(event)
		default:
			log.Debugf("invalid mouse event: %v", event)
		}
	}
}

func (h *Hid) mouseDown(event []int) {
	button := byte(event[1])

	if _, ok := mouseButtonMap[button]; !ok {
		log.Errorf("invalid mouse button: %v", event)
		return
	}

	data := []byte{button, 0, 0, 0}
	h.WriteHid1(data)
}

func (h *Hid) mouseUp() {
	data := []byte{0, 0, 0, 0}
	h.WriteHid1(data)
}

func (h *Hid) mouseScroll(event []int) {
	direction := 0x01
	if event[3] > 0 {
		direction = -0x1
	}

	data := []byte{0, 0, 0, byte(direction)}
	h.WriteHid1(data)
}
func (h *Hid) mouseMoveAbsolute(event []int) {
	x := make([]byte, 2)
	y := make([]byte, 2)
	binary.LittleEndian.PutUint16(x, uint16(event[2]))
	binary.LittleEndian.PutUint16(y, uint16(event[3]))

	data := []byte{0, x[0], x[1], y[0], y[1], 0}
	h.WriteHid2(data)
}

func (h *Hid) mouseMoveRelative(event []int) {
	data := []byte{byte(event[1]), byte(event[2]), byte(event[3]), 0}
	h.WriteHid1(data)
}
