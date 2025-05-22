// TODO: refactor it

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
    ],
    rus: [
      '{escape} F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12',
      'Backquote Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal {backspace}',
      '{tab} RusQ RusW RusE RusR RusT RusY RusU RusI RusO RusP RusBracketLeft RusBracketRight RusBackslash',
      '{capslock} RusA RusS RusD RusF RusG RusH RusJ RusK RusL RusSemicolon RusQuote {enter}',
      '{shiftleft} RusZ RusX RusC RusV RusB RusN RusM RusComma RusPeriod RusSlash {shiftright}',
      '{controlleft} {winleft} {altleft} {space} {altright} {winright} {menu} {controlright}'
    ],
    azerty: [
      '{escape} F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12',
      'Backquote_azerty Digit1_azerty Digit2_azerty Digit3_azerty Digit4_azerty Digit5_azerty Digit6_azerty Digit7_azerty Digit8_azerty Digit9_azerty Digit0_azerty Minus_azerty Equal_azerty {backspace}',
      '{tab} KeyA_azerty KeyZ_azerty KeyE_azerty KeyR_azerty KeyT_azerty KeyY_azerty KeyU_azerty KeyI_azerty KeyO_azerty KeyP_azerty BracketLeft_azerty BracketRight_azerty Backslash_azerty',
      '{capslock} KeyQ_azerty KeyS_azerty KeyD_azerty KeyF_azerty KeyG_azerty KeyH_azerty KeyJ_azerty KeyK_azerty KeyL_azerty Semicolon_azerty Quote_azerty {enter}',
      '{shiftleft} KeyW_azerty KeyX_azerty KeyC_azerty KeyV_azerty KeyB_azerty KeyN_azerty KeyM_azerty Comma_azerty Period_azerty Slash_azerty {shiftright}',
      '{controlleft} {winleft} {altleft} {space} {altright} {winright} {menu} {controlright}'
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
    '{controlright}': 'Ctrl',

    RusQ: 'Й',
    RusW: 'Ц',
    RusE: 'У',
    RusR: 'К',
    RusT: 'Е',
    RusY: 'Н',
    RusU: 'Г',
    RusI: 'Ш',
    RusO: 'Щ',
    RusP: 'З',
    RusBracketLeft: 'Х',
    RusBracketRight: 'Ъ',
    RusBackslash: '/<br>\\',

    RusA: 'Ф',
    RusS: 'Ы',
    RusD: 'В',
    RusF: 'А',
    RusG: 'П',
    RusH: 'Р',
    RusJ: 'О',
    RusK: 'Л',
    RusL: 'Д',
    RusSemicolon: 'Ж',
    RusQuote: 'Э',

    RusZ: 'Я',
    RusX: 'Ч',
    RusC: 'С',
    RusV: 'М',
    RusB: 'И',
    RusN: 'Т',
    RusM: 'Ь',
    RusComma: 'Б',
    RusPeriod: 'Ю',
    RusSlash: ',<br/>.',

    // AZERTY specific display keys
    // Row 1
    Backquote_azerty: '&#60;<br/>&#62;',
    Digit1_azerty: '&<br/>1',
    Digit2_azerty: 'é<br/>2',
    Digit3_azerty: '"<br/>#',
    Digit4_azerty: "'<br/>{",
    Digit5_azerty: '(<br/>[',
    Digit6_azerty: '-<br/>|',
    Digit7_azerty: 'è<br/>`',
    Digit8_azerty: '_<br/>\\',
    Digit9_azerty: 'ç<br/>^',
    Digit0_azerty: 'à<br/>@',
    Minus_azerty: ')<br/>]',
    Equal_azerty: '=<br/>}',

    // Row 2
    KeyA_azerty: 'A',
    KeyZ_azerty: 'Z',
    KeyE_azerty: 'E<br/>€',
    KeyR_azerty: 'R',
    KeyT_azerty: 'T',
    KeyY_azerty: 'Y',
    KeyU_azerty: 'U',
    KeyI_azerty: 'I',
    KeyO_azerty: 'O',
    KeyP_azerty: 'P',
    BracketLeft_azerty: '¨<br/>^',
    BracketRight_azerty: '£<br/>$',
    Backslash_azerty: 'µ<br/>*',

    // Row 3
    KeyQ_azerty: 'Q',
    KeyS_azerty: 'S',
    KeyD_azerty: 'D',
    KeyF_azerty: 'F',
    KeyG_azerty: 'G',
    KeyH_azerty: 'H',
    KeyJ_azerty: 'J',
    KeyK_azerty: 'K',
    KeyL_azerty: 'L',
    Semicolon_azerty: 'M',
    Quote_azerty: '%<br/>ù',

    // Row 4
    KeyW_azerty: 'W',
    KeyX_azerty: 'X',
    KeyC_azerty: 'C',
    KeyV_azerty: 'V',
    KeyB_azerty: 'B',
    KeyN_azerty: 'N',
    KeyM_azerty: '?<br/>,',
    Comma_azerty: '.<br/>;',
    Period_azerty: '/<br/>:',
    Slash_azerty: '§<br/>!'
  },
  // Enable layout-specific display
  mergeDisplay: true,
  layoutCandidates: {
    default: 'default',
    shift: 'shift',
    azerty: 'azerty'
  }
  // ...remaining options...
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
  ['{winleft}', 'MetaLeft'],
  ['{space}', 'Space'],
  ['{metaright}', 'MetaRight'],
  ['{winright}', 'MetaRight'],
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
