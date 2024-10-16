package hid

func (h *Hid) Keyboard(queue <-chan []int) {
	for event := range queue {
		h.kbMutex.Lock()
		h.writeKeyboard(event)
		h.kbMutex.Unlock()
	}
}

func (h *Hid) writeKeyboard(event []int) {
	var data []byte

	if event[0] > 0 {
		code := byte(event[0])
		modifier := getModifier(event)
		data = []byte{modifier, 0x00, code, 0x00, 0x00, 0x00, 0x00, 0x00}
	} else {
		data = []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}
	}

	h.Write(h.g0, data)
}

func getModifier(event []int) byte {
	var modifier byte = 0x00

	if event[1] == 1 {
		modifier |= ModifierLCtrl
	}

	if event[2] == 1 {
		modifier |= ModifierLShift
	}

	if event[3] == 1 {
		modifier |= ModifierLAlt
	} else if event[3] == 2 {
		modifier |= ModifierRAlt
	}

	if event[4] == 1 {
		modifier |= ModifierLGUI
	}

	return modifier
}
