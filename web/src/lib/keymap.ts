// Modifier key bit positions
export const ModifierBits = {
  LeftCtrl: 1 << 0,
  LeftShift: 1 << 1,
  LeftAlt: 1 << 2,
  LeftMeta: 1 << 3,
  RightCtrl: 1 << 4,
  RightShift: 1 << 5,
  RightAlt: 1 << 6,
  RightMeta: 1 << 7
} as const;

// Map event.code to HID modifier bit
export const ModifierMap: Record<string, number> = {
  ControlLeft: ModifierBits.LeftCtrl,
  ShiftLeft: ModifierBits.LeftShift,
  AltLeft: ModifierBits.LeftAlt,
  MetaLeft: ModifierBits.LeftMeta,
  ControlRight: ModifierBits.RightCtrl,
  ShiftRight: ModifierBits.RightShift,
  AltRight: ModifierBits.RightAlt,
  MetaRight: ModifierBits.RightMeta
};

// Map event.code to HID keycode
export const KeycodeMap: Record<string, number> = {
  // Letters
  KeyA: 0x04,
  KeyB: 0x05,
  KeyC: 0x06,
  KeyD: 0x07,
  KeyE: 0x08,
  KeyF: 0x09,
  KeyG: 0x0a,
  KeyH: 0x0b,
  KeyI: 0x0c,
  KeyJ: 0x0d,
  KeyK: 0x0e,
  KeyL: 0x0f,
  KeyM: 0x10,
  KeyN: 0x11,
  KeyO: 0x12,
  KeyP: 0x13,
  KeyQ: 0x14,
  KeyR: 0x15,
  KeyS: 0x16,
  KeyT: 0x17,
  KeyU: 0x18,
  KeyV: 0x19,
  KeyW: 0x1a,
  KeyX: 0x1b,
  KeyY: 0x1c,
  KeyZ: 0x1d,

  // Numbers
  Digit1: 0x1e,
  Digit2: 0x1f,
  Digit3: 0x20,
  Digit4: 0x21,
  Digit5: 0x22,
  Digit6: 0x23,
  Digit7: 0x24,
  Digit8: 0x25,
  Digit9: 0x26,
  Digit0: 0x27,

  // Special keys
  Enter: 0x28,
  Escape: 0x29,
  Backspace: 0x2a,
  Tab: 0x2b,
  Space: 0x2c,
  Minus: 0x2d,
  Equal: 0x2e,
  BracketLeft: 0x2f,
  BracketRight: 0x30,
  Backslash: 0x31,
  Semicolon: 0x33,
  Quote: 0x34,
  Backquote: 0x35,
  Comma: 0x36,
  Period: 0x37,
  Slash: 0x38,
  CapsLock: 0x39,

  // Function keys
  F1: 0x3a,
  F2: 0x3b,
  F3: 0x3c,
  F4: 0x3d,
  F5: 0x3e,
  F6: 0x3f,
  F7: 0x40,
  F8: 0x41,
  F9: 0x42,
  F10: 0x43,
  F11: 0x44,
  F12: 0x45,

  // Control keys
  PrintScreen: 0x46,
  ScrollLock: 0x47,
  Pause: 0x48,
  Insert: 0x49,
  Home: 0x4a,
  PageUp: 0x4b,
  Delete: 0x4c,
  End: 0x4d,
  PageDown: 0x4e,

  // Arrow keys
  ArrowRight: 0x4f,
  ArrowLeft: 0x50,
  ArrowDown: 0x51,
  ArrowUp: 0x52,

  // Numpad
  NumLock: 0x53,
  NumpadDivide: 0x54,
  NumpadMultiply: 0x55,
  NumpadSubtract: 0x56,
  NumpadAdd: 0x57,
  NumpadEnter: 0x58,
  Numpad1: 0x59,
  Numpad2: 0x5a,
  Numpad3: 0x5b,
  Numpad4: 0x5c,
  Numpad5: 0x5d,
  Numpad6: 0x5e,
  Numpad7: 0x5f,
  Numpad8: 0x60,
  Numpad9: 0x61,
  Numpad0: 0x62,
  NumpadDecimal: 0x63,

  // International / Non-US keyboard keys
  IntlBackslash: 0x64,
  ContextMenu: 0x65,
  Power: 0x66,
  NumpadEqual: 0x67,

  // Extended function keys
  F13: 0x68,
  F14: 0x69,
  F15: 0x6a,
  F16: 0x6b,
  F17: 0x6c,
  F18: 0x6d,
  F19: 0x6e,
  F20: 0x6f,
  F21: 0x70,
  F22: 0x71,
  F23: 0x72,
  F24: 0x73,

  // System / Edit keys
  Execute: 0x74,
  Help: 0x75,
  Props: 0x76,
  Select: 0x77,
  Stop: 0x78,
  Again: 0x79,
  Undo: 0x7a,
  Cut: 0x7b,
  Copy: 0x7c,
  Paste: 0x7d,
  Find: 0x7e,

  // Media / Volume keys
  AudioVolumeMute: 0x7f,
  AudioVolumeUp: 0x80,
  AudioVolumeDown: 0x81,
  VolumeMute: 0x7f, // Alias
  VolumeUp: 0x80, // Alias
  VolumeDown: 0x81, // Alias

  // Locking keys (for keyboards with physical lock keys)
  LockingCapsLock: 0x82,
  LockingNumLock: 0x83,
  LockingScrollLock: 0x84,

  // Numpad additional
  NumpadComma: 0x85,
  NumpadEqual2: 0x86, // AS/400 keyboard equal key

  // International keys - Japanese
  IntlRo: 0x87, // Japanese Ro key (ろ)
  KanaMode: 0x88, // Katakana/Hiragana toggle
  IntlYen: 0x89, // Japanese Yen (¥)
  Convert: 0x8a, // Japanese Henkan (変換)
  NonConvert: 0x8b, // Japanese Muhenkan (無変換)

  // International keys - Additional Japanese
  International6: 0x8c,
  International7: 0x8d,
  International8: 0x8e,
  International9: 0x8f,

  // Language keys - Korean/Japanese/Chinese
  Lang1: 0x90, // Korean Hangul/English toggle
  Lang2: 0x91, // Korean Hanja
  Lang3: 0x92, // Japanese Katakana
  Lang4: 0x93, // Japanese Hiragana
  Lang5: 0x94, // Japanese Zenkaku/Hankaku
  Lang6: 0x95,
  Lang7: 0x96,
  Lang8: 0x97,
  Lang9: 0x98,

  // ISO keyboard specific
  IntlHash: 0x32, // Non-US # and ~ (ISO keyboards)

  // Numpad extended
  NumpadParenLeft: 0xb6,
  NumpadParenRight: 0xb7,
  NumpadBackspace: 0xbb,
  NumpadMemoryStore: 0xd0,
  NumpadMemoryRecall: 0xd1,
  NumpadMemoryClear: 0xd2,
  NumpadMemoryAdd: 0xd3,
  NumpadMemorySubtract: 0xd4,
  NumpadClear: 0xd8,
  NumpadClearEntry: 0xd9,

  // Additional browser/system keys
  BrowserSearch: 0xf0,
  BrowserHome: 0xf1,
  BrowserBack: 0xf2,
  BrowserForward: 0xf3,
  BrowserStop: 0xf4,
  BrowserRefresh: 0xf5,
  BrowserFavorites: 0xf6,

  // Media keys
  MediaPlayPause: 0xe8,
  MediaStop: 0xe9,
  MediaTrackPrevious: 0xea,
  MediaTrackNext: 0xeb,
  Eject: 0xec,
  MediaSelect: 0xed,

  // Application launch keys
  LaunchMail: 0xee,
  LaunchApp1: 0xef,
  LaunchApp2: 0xf0,

  // Sleep/Wake keys
  Sleep: 0xf8,
  Wake: 0xf9,

  // Accessibility keys
  MediaRewind: 0xfa,
  MediaFastForward: 0xfb
};

// Check if code is a modifier key
export function isModifier(code: string): boolean {
  return code in ModifierMap;
}

// Get modifier bit for code
export function getModifierBit(code: string): number {
  return ModifierMap[code] ?? 0;
}

// Get keycode for code
export function getKeycode(code: string): number | undefined {
  return KeycodeMap[code];
}
