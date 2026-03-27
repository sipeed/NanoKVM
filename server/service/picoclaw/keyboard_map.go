package picoclaw

import (
	"fmt"
	"strings"
)

const (
	modifierLeftCtrl   = 1 << 0
	modifierLeftShift  = 1 << 1
	modifierLeftAlt    = 1 << 2
	modifierLeftMeta   = 1 << 3
	modifierRightCtrl  = 1 << 4
	modifierRightShift = 1 << 5
	modifierRightAlt   = 1 << 6
	modifierRightMeta  = 1 << 7
)

var modifierMap = map[string]byte{
	"ControlLeft":  modifierLeftCtrl,
	"ShiftLeft":    modifierLeftShift,
	"AltLeft":      modifierLeftAlt,
	"MetaLeft":     modifierLeftMeta,
	"ControlRight": modifierRightCtrl,
	"ShiftRight":   modifierRightShift,
	"AltRight":     modifierRightAlt,
	"MetaRight":    modifierRightMeta,
}

var keyAliases = map[string]string{
	"CTRL":      "ControlLeft",
	"CONTROL":   "ControlLeft",
	"SHIFT":     "ShiftLeft",
	"ALT":       "AltLeft",
	"OPTION":    "AltLeft",
	"META":      "MetaLeft",
	"WIN":       "MetaLeft",
	"WINDOWS":   "MetaLeft",
	"COMMAND":   "MetaLeft",
	"CMD":       "MetaLeft",
	"SUPER":     "MetaLeft",
	"ESC":       "Escape",
	"RETURN":    "Enter",
	"DEL":       "Delete",
	"INS":       "Insert",
	"UP":        "ArrowUp",
	"DOWN":      "ArrowDown",
	"LEFT":      "ArrowLeft",
	"RIGHT":     "ArrowRight",
	"SPACEBAR":  "Space",
	"SPACE":     "Space",
	"TAB":       "Tab",
	"ENTER":     "Enter",
	"BACKSPACE": "Backspace",
	"PGUP":      "PageUp",
	"PGDN":      "PageDown",
}

var keycodeMap = map[string]byte{
	"KeyA": 0x04, "KeyB": 0x05, "KeyC": 0x06, "KeyD": 0x07, "KeyE": 0x08,
	"KeyF": 0x09, "KeyG": 0x0a, "KeyH": 0x0b, "KeyI": 0x0c, "KeyJ": 0x0d,
	"KeyK": 0x0e, "KeyL": 0x0f, "KeyM": 0x10, "KeyN": 0x11, "KeyO": 0x12,
	"KeyP": 0x13, "KeyQ": 0x14, "KeyR": 0x15, "KeyS": 0x16, "KeyT": 0x17,
	"KeyU": 0x18, "KeyV": 0x19, "KeyW": 0x1a, "KeyX": 0x1b, "KeyY": 0x1c,
	"KeyZ": 0x1d,

	"Digit1": 0x1e, "Digit2": 0x1f, "Digit3": 0x20, "Digit4": 0x21, "Digit5": 0x22,
	"Digit6": 0x23, "Digit7": 0x24, "Digit8": 0x25, "Digit9": 0x26, "Digit0": 0x27,

	"Enter":        0x28,
	"Escape":       0x29,
	"Backspace":    0x2a,
	"Tab":          0x2b,
	"Space":        0x2c,
	"Minus":        0x2d,
	"Equal":        0x2e,
	"BracketLeft":  0x2f,
	"BracketRight": 0x30,
	"Backslash":    0x31,
	"Semicolon":    0x33,
	"Quote":        0x34,
	"Backquote":    0x35,
	"Comma":        0x36,
	"Period":       0x37,
	"Slash":        0x38,
	"CapsLock":     0x39,

	"F1": 0x3a, "F2": 0x3b, "F3": 0x3c, "F4": 0x3d, "F5": 0x3e, "F6": 0x3f,
	"F7": 0x40, "F8": 0x41, "F9": 0x42, "F10": 0x43, "F11": 0x44, "F12": 0x45,

	"PrintScreen": 0x46,
	"ScrollLock":  0x47,
	"Pause":       0x48,
	"Insert":      0x49,
	"Home":        0x4a,
	"PageUp":      0x4b,
	"Delete":      0x4c,
	"End":         0x4d,
	"PageDown":    0x4e,
	"ArrowRight":  0x4f,
	"ArrowLeft":   0x50,
	"ArrowDown":   0x51,
	"ArrowUp":     0x52,

	"NumLock":        0x53,
	"NumpadDivide":   0x54,
	"NumpadMultiply": 0x55,
	"NumpadSubtract": 0x56,
	"NumpadAdd":      0x57,
	"NumpadEnter":    0x58,
	"Numpad1":        0x59,
	"Numpad2":        0x5a,
	"Numpad3":        0x5b,
	"Numpad4":        0x5c,
	"Numpad5":        0x5d,
	"Numpad6":        0x5e,
	"Numpad7":        0x5f,
	"Numpad8":        0x60,
	"Numpad9":        0x61,
	"Numpad0":        0x62,
	"NumpadDecimal":  0x63,

	"IntlBackslash": 0x64,
	"ContextMenu":   0x65,
	"Power":         0x66,
	"NumpadEqual":   0x67,
	"F13":           0x68, "F14": 0x69, "F15": 0x6a, "F16": 0x6b, "F17": 0x6c, "F18": 0x6d,
	"F19": 0x6e, "F20": 0x6f, "F21": 0x70, "F22": 0x71, "F23": 0x72, "F24": 0x73,

	"Execute": 0x74,
	"Help":    0x75,
	"Props":   0x76,
	"Select":  0x77,
	"Stop":    0x78,
	"Again":   0x79,
	"Undo":    0x7a,
	"Cut":     0x7b,
	"Copy":    0x7c,
	"Paste":   0x7d,
	"Find":    0x7e,

	"AudioVolumeMute": 0x7f,
	"AudioVolumeUp":   0x80,
	"AudioVolumeDown": 0x81,
	"VolumeMute":      0x7f,
	"VolumeUp":        0x80,
	"VolumeDown":      0x81,

	"LockingCapsLock":   0x82,
	"LockingNumLock":    0x83,
	"LockingScrollLock": 0x84,
	"NumpadComma":       0x85,
	"NumpadEqual2":      0x86,
	"IntlRo":            0x87,
	"KanaMode":          0x88,
	"IntlYen":           0x89,
	"Convert":           0x8a,
	"NonConvert":        0x8b,
	"International6":    0x8c,
	"International7":    0x8d,
	"International8":    0x8e,
	"International9":    0x8f,
	"Lang1":             0x90, "Lang2": 0x91, "Lang3": 0x92, "Lang4": 0x93, "Lang5": 0x94,
	"Lang6": 0x95, "Lang7": 0x96, "Lang8": 0x97, "Lang9": 0x98,
	"IntlHash": 0x32,

	"NumpadParenLeft":      0xb6,
	"NumpadParenRight":     0xb7,
	"NumpadBackspace":      0xbb,
	"NumpadMemoryStore":    0xd0,
	"NumpadMemoryRecall":   0xd1,
	"NumpadMemoryClear":    0xd2,
	"NumpadMemoryAdd":      0xd3,
	"NumpadMemorySubtract": 0xd4,
	"NumpadClear":          0xd8,
	"NumpadClearEntry":     0xd9,

	"BrowserSearch":    0xf0,
	"BrowserHome":      0xf1,
	"BrowserBack":      0xf2,
	"BrowserForward":   0xf3,
	"BrowserStop":      0xf4,
	"BrowserRefresh":   0xf5,
	"BrowserFavorites": 0xf6,

	"MediaPlayPause":     0xe8,
	"MediaStop":          0xe9,
	"MediaTrackPrevious": 0xea,
	"MediaTrackNext":     0xeb,
	"Eject":              0xec,
	"MediaSelect":        0xed,
	"LaunchMail":         0xee,
	"LaunchApp1":         0xef,
	"LaunchApp2":         0xf0,
	"Sleep":              0xf8,
	"Wake":               0xf9,
	"MediaRewind":        0xfa,
	"MediaFastForward":   0xfb,
}

func resolveKey(key string) (string, byte, bool, error) {
	trimmed := strings.TrimSpace(key)
	if trimmed == "" {
		return "", 0, false, fmt.Errorf("empty key")
	}

	if modifier, ok := modifierMap[trimmed]; ok {
		return trimmed, modifier, true, nil
	}
	if _, ok := keycodeMap[trimmed]; ok {
		return trimmed, keycodeMap[trimmed], false, nil
	}

	upper := strings.ToUpper(trimmed)
	if alias, ok := keyAliases[upper]; ok {
		if modifier, ok := modifierMap[alias]; ok {
			return alias, modifier, true, nil
		}
		return alias, keycodeMap[alias], false, nil
	}

	if len(upper) == 1 && upper[0] >= 'A' && upper[0] <= 'Z' {
		code := "Key" + upper
		return code, keycodeMap[code], false, nil
	}
	if len(upper) == 1 && upper[0] >= '0' && upper[0] <= '9' {
		code := "Digit" + upper
		return code, keycodeMap[code], false, nil
	}

	if modifier, ok := modifierMap[upper]; ok {
		return upper, modifier, true, nil
	}
	if code, ok := keycodeMap[trimmed]; ok {
		return trimmed, code, false, nil
	}
	if code, ok := keycodeMap[upper]; ok {
		return upper, code, false, nil
	}

	return "", 0, false, fmt.Errorf("unsupported key: %s", key)
}

func buildHotkeyReport(keys []string) ([]byte, *PicoclawError) {
	if len(keys) == 0 {
		return nil, newPicoclawError(CodeInvalidAction, "hotkey requires at least one key")
	}

	report := make([]byte, 8)
	nextIndex := 2

	for _, key := range keys {
		_, code, isModifier, err := resolveKey(key)
		if err != nil {
			return nil, newPicoclawError(CodeInvalidAction, err.Error())
		}

		if isModifier {
			report[0] |= code
			continue
		}

		if nextIndex >= len(report) {
			return nil, newPicoclawError(CodeInvalidAction, "hotkey supports at most 6 non-modifier keys")
		}
		report[nextIndex] = code
		nextIndex++
	}

	return report, nil
}
