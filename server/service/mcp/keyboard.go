package mcpservice

import (
	"fmt"
	"sort"

	"NanoKVM-Server/service/hid"
)

const maxKeyboardKeys = 6

var keyUpReport = []byte{0, 0, 0, 0, 0, 0, 0, 0}

var modifierMap = map[string]byte{
	"ControlLeft":  1 << 0,
	"ShiftLeft":    1 << 1,
	"AltLeft":      1 << 2,
	"MetaLeft":     1 << 3,
	"ControlRight": 1 << 4,
	"ShiftRight":   1 << 5,
	"AltRight":     1 << 6,
	"MetaRight":    1 << 7,
}

var keyCodeMap = map[string]byte{
	"KeyA": 0x04, "KeyB": 0x05, "KeyC": 0x06, "KeyD": 0x07, "KeyE": 0x08,
	"KeyF": 0x09, "KeyG": 0x0a, "KeyH": 0x0b, "KeyI": 0x0c, "KeyJ": 0x0d,
	"KeyK": 0x0e, "KeyL": 0x0f, "KeyM": 0x10, "KeyN": 0x11, "KeyO": 0x12,
	"KeyP": 0x13, "KeyQ": 0x14, "KeyR": 0x15, "KeyS": 0x16, "KeyT": 0x17,
	"KeyU": 0x18, "KeyV": 0x19, "KeyW": 0x1a, "KeyX": 0x1b, "KeyY": 0x1c,
	"KeyZ": 0x1d,

	"Digit1": 0x1e, "Digit2": 0x1f, "Digit3": 0x20, "Digit4": 0x21, "Digit5": 0x22,
	"Digit6": 0x23, "Digit7": 0x24, "Digit8": 0x25, "Digit9": 0x26, "Digit0": 0x27,

	"Enter": 0x28, "Escape": 0x29, "Backspace": 0x2a, "Tab": 0x2b, "Space": 0x2c,
	"Minus": 0x2d, "Equal": 0x2e, "BracketLeft": 0x2f, "BracketRight": 0x30,
	"Backslash": 0x31, "IntlHash": 0x32, "Semicolon": 0x33, "Quote": 0x34,
	"Backquote": 0x35, "Comma": 0x36, "Period": 0x37, "Slash": 0x38,
	"CapsLock": 0x39,

	"F1": 0x3a, "F2": 0x3b, "F3": 0x3c, "F4": 0x3d, "F5": 0x3e, "F6": 0x3f,
	"F7": 0x40, "F8": 0x41, "F9": 0x42, "F10": 0x43, "F11": 0x44, "F12": 0x45,

	"PrintScreen": 0x46, "ScrollLock": 0x47, "Pause": 0x48, "Insert": 0x49,
	"Home": 0x4a, "PageUp": 0x4b, "Delete": 0x4c, "End": 0x4d,
	"PageDown": 0x4e, "ArrowRight": 0x4f, "ArrowLeft": 0x50,
	"ArrowDown": 0x51, "ArrowUp": 0x52,

	"NumLock": 0x53, "NumpadDivide": 0x54, "NumpadMultiply": 0x55,
	"NumpadSubtract": 0x56, "NumpadAdd": 0x57, "NumpadEnter": 0x58,
	"Numpad1": 0x59, "Numpad2": 0x5a, "Numpad3": 0x5b, "Numpad4": 0x5c,
	"Numpad5": 0x5d, "Numpad6": 0x5e, "Numpad7": 0x5f, "Numpad8": 0x60,
	"Numpad9": 0x61, "Numpad0": 0x62, "NumpadDecimal": 0x63,
	"IntlBackslash": 0x64, "ContextMenu": 0x65,
}

func supportedKeyNames() []any {
	names := make([]string, 0, len(modifierMap)+len(keyCodeMap))
	for name := range modifierMap {
		names = append(names, name)
	}
	for name := range keyCodeMap {
		names = append(names, name)
	}
	sort.Strings(names)

	values := make([]any, len(names))
	for index, name := range names {
		values[index] = name
	}
	return values
}

func buildKeyComboReport(keys []string) ([]byte, error) {
	report := make([]byte, 8)
	seenKeys := make(map[byte]struct{})
	keyIndex := 2

	for _, key := range keys {
		if modifier, ok := modifierMap[key]; ok {
			report[0] |= modifier
			continue
		}

		code, ok := keyCodeMap[key]
		if !ok {
			return nil, fmt.Errorf("unknown key: %s", key)
		}
		if _, ok := seenKeys[code]; ok {
			continue
		}
		if keyIndex >= 2+maxKeyboardKeys {
			return nil, fmt.Errorf("too many non-modifier keys")
		}
		seenKeys[code] = struct{}{}
		report[keyIndex] = code
		keyIndex++
	}

	return report, nil
}

func buildTypeReports(text string) ([][]byte, []rune) {
	charMap := hid.GetCharMap("")
	reports := make([][]byte, 0, len(text)*2)
	skipped := make([]rune, 0)

	for _, char := range text {
		key, ok := charMap[char]
		if !ok {
			skipped = append(skipped, char)
			continue
		}
		reports = append(reports,
			[]byte{byte(key.Modifiers), 0, byte(key.Code), 0, 0, 0, 0, 0},
			append([]byte(nil), keyUpReport...),
		)
	}

	return reports, skipped
}
