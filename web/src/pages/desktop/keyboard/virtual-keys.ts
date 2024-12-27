// main keys
export const keyboardOptions = {
  theme: 'simple-keyboard hg-theme-default',
  baseClass: 'simple-keyboard-main',
  layout: {
    default: [
      '{escape} F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12',
      'Backquote Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal {backspace}',
      '{tab} KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP BracketLeft BracketRight Backslash',
      '{capslock} KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL Semicolon Quote {enter}',
      '{shiftleft} KeyZ KeyX KeyC KeyV KeyB KeyN KeyM Comma Period Slash {shiftright}',
      '{controlleft} {winleft} {altleft} {space} {altright} {winright} {menu} {controlright}'
    ],
    mac: [
      '{escape} F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12',
      'Backquote Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal {backspace}',
      '{tab} KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP BracketLeft BracketRight Backslash',
      '{capslock} KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL Semicolon Quote {enter}',
      '{shiftleft} KeyZ KeyX KeyC KeyV KeyB KeyN KeyM Comma Period Slash {shiftright}',
      '{controlleft} {altleft} {metaleft} {space} {metaright} {altright}'
    ]
  },
  display: {
    '{escape}': 'Esc',
    Backquote: '~<br/>`',
    Digit1: '!<br/>1',
    Digit2: '@<br/>2',
    Digit3: '#<br/>3',
    Digit4: '$<br/>4',
    Digit5: '%<br/>5',
    Digit6: '^<br/>6',
    Digit7: '&<br/>7',
    Digit8: '*<br/>8',
    Digit9: '(<br/>9',
    Digit0: ')<br/>0',
    Minus: '_<br/>-',
    Equal: '+<br/>=',
    '{backspace}': 'Backspace',

    '{tab}': 'Tab',
    KeyQ: 'Q',
    KeyW: 'W',
    KeyE: 'E',
    KeyR: 'R',
    KeyT: 'T',
    KeyY: 'Y',
    KeyU: 'U',
    KeyI: 'I',
    KeyO: 'O',
    KeyP: 'P',
    BracketLeft: '{<br/>[',
    BracketRight: '}<br/>]',
    Backslash: '|<br>\\',

    '{capslock}': 'Caps',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    KeyF: 'F',
    KeyG: 'G',
    KeyH: 'H',
    KeyJ: 'J',
    KeyK: 'K',
    KeyL: 'L',
    Semicolon: ':<br/>;',
    Quote: '"<br/>\'',
    '{enter}': 'Enter',

    '{shiftleft}': 'Shift',
    KeyZ: 'Z',
    KeyX: 'X',
    KeyC: 'C',
    KeyV: 'V',
    KeyB: 'B',
    KeyN: 'N',
    KeyM: 'M',
    Comma: '<<br/>,',
    Period: '><br/>.',
    Slash: '?<br/>/',
    '{shiftright}': 'Shift',

    '{controlleft}': 'Ctrl',
    '{altleft}': 'Alt',
    '{metaleft}': 'Cmd',
    '{winleft}': 'Win',
    '{space}': 'Space',
    '{metaright}': 'Cmd',
    '{winright}': 'Win',
    '{altright}': 'Alt',
    '{menu}': 'Menu',
    '{controlright}': 'Ctrl'
  }
};

// control keys
export const keyboardControlPadOptions = {
  theme: 'simple-keyboard hg-theme-default',
  baseClass: 'simple-keyboard-control',
  layout: {
    default: [
      '{prtscr} {scrolllock} {pause}',
      '{insert} {home} {pageup}',
      '{delete} {end} {pagedown}'
    ]
  },

  display: {
    '{prtscr}': 'PrtScr',
    '{scrolllock}': 'Lock',
    '{pause}': 'Pause',
    '{insert}': 'Ins',
    '{home}': 'Home',
    '{pageup}': 'PgUp',
    '{delete}': 'Del',
    '{end}': 'End',
    '{pagedown}': 'PgDn'
  }
};

// arrow keys
export const keyboardArrowsOptions = {
  theme: 'simple-keyboard hg-theme-default',
  baseClass: 'simple-keyboard-arrows',
  layout: {
    default: ['{arrowup}', '{arrowleft} {arrowdown} {arrowright}']
  }
};

// keys require special mapping
export const specialKeyMap = new Map([
  ['{escape}', 'Escape'],
  ['{backspace}', 'Backspace'],
  ['{tab}', 'Tab'],
  ['{capslock}', 'CapsLock'],
  ['{enter}', 'Enter'],
  ['{shiftleft}', 'ShiftLeft'],
  ['{shiftright}', 'ShiftRight'],
  ['{controlleft}', 'ControlLeft'],
  ['{controlright}', 'ControlRight'],
  ['{altleft}', 'AltLeft'],
  ['{metaleft}', 'MetaLeft'],
  ['{winleft}', 'WinLeft'],
  ['{space}', 'Space'],
  ['{metaright}', 'MetaRight'],
  ['{winright}', 'WinRight'],
  ['{altright}', 'AltRight'],
  ['{prtscr}', 'PrintScreen'],
  ['{scrolllock}', 'ScrollLock'],
  ['{pause}', 'Pause'],
  ['{insert}', 'Insert'],
  ['{home}', 'Home'],
  ['{pageup}', 'PageUp'],
  ['{delete}', 'Delete'],
  ['{end}', 'End'],
  ['{pagedown}', 'PageDown'],
  ['{arrowright}', 'ArrowRight'],
  ['{arrowleft}', 'ArrowLeft'],
  ['{arrowdown}', 'ArrowDown'],
  ['{arrowup}', 'ArrowUp']
]);

// modifier keys
export const modifierKeys = [
  '{shiftleft}',
  '{controlleft}',
  '{altleft}',
  '{metaleft}',
  '{winleft}',
  '{shiftright}',
  '{controlright}',
  '{altright}',
  '{metaright}',
  '{winright}'
];

// double line display buttons
export const doubleKeys = [
  'Backquote',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  'Digit0',
  'Minus',
  'Equal',
  'BracketLeft',
  'BracketRight',
  'Backslash',
  'Semicolon',
  'Quote',
  'Comma',
  'Period',
  'Slash'
];
