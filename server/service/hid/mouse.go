package hid

import (
	"encoding/binary"
	"errors"
	log "github.com/sirupsen/logrus"
	"os"
	"time"
)

func Mouse(queue <-chan []int) {
	for event := range queue {
		switch event[0] {
		case MouseDown:
			mouseDown(event)
		case MouseUp:
			mouseUp()
		case MouseMoveAbsolute:
			mouseMoveAbsolute(event)
		case MouseMoveRelative:
			mouseMoveRelative(event)
		case MouseScroll:
			scroll(event)
		default:
			log.Debugf("invalid mouse event: %+v", event)
		}
	}
}

func mouseDown(event []int) {
	var button byte

	switch event[1] {
	case MouseLeft:
		button = HidMouseLeft
	case MouseRight:
		button = HidMouseRight
	case MouseWheel:
		button = HidMouseWheel
	default:
		log.Debugf("invalid mouse button: %+v", event)
		return
	}

	data := []byte{button, 0, 0, 0}
	writeWithTimeout(Hidg1, data)
}

func mouseUp() {
	data := []byte{0, 0, 0, 0}
	writeWithTimeout(Hidg1, data)
}

func scroll(event []int) {
	direction := 0x01
	if event[3] > 0 {
		direction = -0x1
	}

	data := []byte{0, 0, 0, byte(direction)}
	writeWithTimeout(Hidg1, data)
}

func mouseMoveAbsolute(event []int) {
	x := make([]byte, 2)
	y := make([]byte, 2)
	binary.LittleEndian.PutUint16(x, uint16(event[2]))
	binary.LittleEndian.PutUint16(y, uint16(event[3]))

	data := []byte{0, x[0], x[1], y[0], y[1], 0}
	writeWithTimeout(Hidg2, data)

}

func mouseMoveRelative(event []int) {
	data := []byte{byte(event[1]), byte(event[2]), byte(event[3]), 0}
	writeWithTimeout(Hidg1, data)
}

func writeWithTimeout(file *os.File, data []byte) {
	deadline := time.Now().Add(9 * time.Millisecond)
	_ = file.SetWriteDeadline(deadline)

	_, err := file.Write(data)
	if err != nil {
		if errors.Is(err, os.ErrClosed) {
			Open()
			log.Debugf("hid already closed, reopen it...")
		} else if errors.Is(err, os.ErrDeadlineExceeded) {
			log.Debugf("write to hid timeout")
		} else {
			log.Errorf("write to hid failed: %s", err)
		}

		return
	}

	log.Debugf("write to hid: %+v", data)
}
