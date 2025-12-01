package hid

func (h *Hid) Keyboard(queue <-chan []int) {
	for event := range queue {
		code := byte(event[0])

		var modifier byte = 0x00
		if code > 0 {
			modifier = byte(event[1]) | byte(event[2]) | byte(event[3]) | byte(event[4])
		}

		data := []byte{modifier, 0x00, code, 0x00, 0x00, 0x00, 0x00, 0x00}
		h.WriteHid0(data)
	}
}
