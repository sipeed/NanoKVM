import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { XIcon } from 'lucide-react';

import { paste } from '@/api/hid.ts';
import { isKeyboardOpenAtom, keyboardLockAtom } from '@/jotai/keyboard.ts';
import { getKeycode, getModifierBit } from '@/lib/keymap.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';

type VirtualKey = {
  code: string;
  label: string;
  width?: number;
};

const modifierCodes = new Set([
  'ControlLeft',
  'ControlRight',
  'ShiftLeft',
  'ShiftRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight'
]);

const rows: VirtualKey[][] = [
  [
    { code: 'Escape', label: 'Esc' },
    ...Array.from({ length: 12 }, (_, index) => ({ code: `F${index + 1}`, label: `F${index + 1}` }))
  ],
  [
    { code: 'Backquote', label: '`' },
    ...Array.from({ length: 10 }, (_, index) => ({ code: `Digit${index + 1}`, label: `${index + 1}` })),
    { code: 'Digit0', label: '0' },
    { code: 'Minus', label: '-' },
    { code: 'Equal', label: '=' },
    { code: 'Backspace', label: '⌫', width: 2 }
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    ...'QWERTYUIOP'.split('').map((key) => ({ code: `Key${key}`, label: key })),
    { code: 'BracketLeft', label: '[' },
    { code: 'BracketRight', label: ']' },
    { code: 'Backslash', label: '\\', width: 1.5 }
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.8 },
    ...'ASDFGHJKL'.split('').map((key) => ({ code: `Key${key}`, label: key })),
    { code: 'Semicolon', label: ';' },
    { code: 'Quote', label: "'" },
    { code: 'Enter', label: 'Enter', width: 2.2 }
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.3 },
    ...'ZXCVBNM'.split('').map((key) => ({ code: `Key${key}`, label: key })),
    { code: 'Comma', label: ',' },
    { code: 'Period', label: '.' },
    { code: 'Slash', label: '/' },
    { code: 'ShiftRight', label: 'Shift', width: 2.3 }
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.5 },
    { code: 'MetaLeft', label: 'Win', width: 1.5 },
    { code: 'AltLeft', label: 'Alt', width: 1.5 },
    { code: 'Space', label: 'Space', width: 6 },
    { code: 'AltRight', label: 'Alt', width: 1.5 },
    { code: 'ContextMenu', label: 'Menu', width: 1.5 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.5 }
  ]
];

const navigationRows: VirtualKey[][] = [
  [
    { code: 'Insert', label: 'Ins' },
    { code: 'Home', label: 'Home' },
    { code: 'PageUp', label: 'PgUp' },
    { code: 'Delete', label: 'Del' },
    { code: 'End', label: 'End' },
    { code: 'PageDown', label: 'PgDn' }
  ],
  [{ code: 'ArrowUp', label: '↑' }],
  [
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowRight', label: '→' }
  ]
];

export const VirtualKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useAtom(isKeyboardOpenAtom);
  const setKeyboardLock = useSetAtom(keyboardLockAtom);
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const [isNativeKeyboardOpen, setIsNativeKeyboardOpen] = useState(false);
  const nativeInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => setKeyboardLock({ source: 'native-keyboard', locked: false });
  }, [setKeyboardLock]);

  if (!isKeyboardOpen) {
    return null;
  }

  function send(modifier: number, key: number) {
    client.send(new Uint8Array([MessageEvent.Keyboard, modifier, 0, key, 0, 0, 0, 0, 0]));
  }

  function sendNativeKey(code: string) {
    const keycode = getKeycode(code);
    if (!keycode) return;
    send(0, keycode);
    send(0, 0);
  }

  function releaseAll() {
    send(0, 0);
  }

  function currentModifierBits() {
    return activeModifiers.reduce((bits, code) => bits | (getModifierBit(code) || 0), 0);
  }

  function press(key: VirtualKey) {
    if (modifierCodes.has(key.code)) {
      setActiveModifiers((current) =>
        current.includes(key.code) ? current.filter((code) => code !== key.code) : [...current, key.code]
      );
      return;
    }

    const keycode = getKeycode(key.code);
    if (!keycode) return;
    send(currentModifierBits(), keycode);
  }

  function release(key: VirtualKey) {
    if (modifierCodes.has(key.code)) return;
    releaseAll();
    if (activeModifiers.length > 0) setActiveModifiers([]);
  }

  function renderKey(key: VirtualKey) {
    const active = activeModifiers.includes(key.code);
    return (
      <button
        className={`min-w-0 flex-1 rounded border border-neutral-300 bg-white px-1 py-2 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-100 active:bg-blue-600 active:text-white ${
          active ? 'bg-blue-600 text-white' : ''
        }`}
        key={key.code}
        onPointerDown={(event) => {
          event.preventDefault();
          press(key);
        }}
        onPointerLeave={() => release(key)}
        onPointerUp={() => release(key)}
        style={{ flexGrow: key.width || 1 }}
        type="button"
      >
        {key.label}
      </button>
    );
  }

  function openNativeKeyboard() {
    setIsNativeKeyboardOpen(true);
    setKeyboardLock({ source: 'native-keyboard', locked: true });
    // Focus must occur directly in this user gesture for iPadOS Safari to show its keyboard.
    nativeInputRef.current?.focus();
  }

  function closeNativeKeyboard() {
    nativeInputRef.current?.blur();
    setIsNativeKeyboardOpen(false);
    setKeyboardLock({ source: 'native-keyboard', locked: false });
  }

  function submitNativeText(event: FormEvent<HTMLTextAreaElement>) {
    const input = event.currentTarget;
    const text = input.value;
    if (!text) return;
    input.value = '';
    void paste(text, 'en');
  }

  function handleNativeKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendNativeKey('Enter');
    } else if (event.key === 'Backspace' && !event.currentTarget.value) {
      event.preventDefault();
      sendNativeKey('Backspace');
    } else if (event.key === 'Tab') {
      event.preventDefault();
      sendNativeKey('Tab');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeNativeKeyboard();
    }
  }

  function closePanel() {
    closeNativeKeyboard();
    releaseAll();
    setActiveModifiers([]);
    setIsKeyboardOpen(false);
  }

  return (
    <div
      aria-label="Virtual keyboard"
      className="fixed bottom-0 left-1/2 z-[999] w-[min(960px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-t-lg bg-neutral-200 shadow-2xl"
      role="dialog"
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-300 bg-white px-3 py-2">
        <span className="text-sm font-medium text-neutral-700">
          {isNativeKeyboardOpen ? '本機原生鍵盤' : '虛擬鍵盤'}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded border border-blue-600 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
            onClick={isNativeKeyboardOpen ? closeNativeKeyboard : openNativeKeyboard}
            type="button"
          >
            {isNativeKeyboardOpen ? '切換到虛擬鍵盤' : '切換到本機鍵盤'}
          </button>
          <button
            aria-label="Close virtual keyboard"
            className="rounded p-1 text-neutral-600 hover:bg-neutral-200"
            onClick={closePanel}
            type="button"
          >
            <XIcon size={18} />
          </button>
        </div>
      </div>
      <textarea
        aria-label="Native device keyboard input"
        autoCapitalize="none"
        autoCorrect="off"
        className={
          isNativeKeyboardOpen
            ? 'm-3 block h-10 w-[calc(100%-1.5rem)] resize-none rounded border border-blue-500 bg-white px-3 py-2 text-base text-neutral-800 outline-none'
            : 'absolute bottom-0 left-0 h-px w-px opacity-0'
        }
        enterKeyHint="enter"
        onInput={submitNativeText}
        onKeyDown={handleNativeKeyDown}
        placeholder="點這裡或用 iPad／手機原生鍵盤輸入文字"
        ref={nativeInputRef}
        spellCheck={false}
      />
      {isNativeKeyboardOpen ? (
        <div className="px-3 pb-3 text-xs text-neutral-600">
          原生鍵盤模式只顯示文字輸入區；Enter、Tab、Backspace 會送到遠端。需要功能鍵或 Ctrl／Alt／Win 時，請切換回虛擬鍵盤。
        </div>
      ) : (
        <>
          <div className="space-y-1 p-2">
            {rows.map((row, index) => (
              <div className="flex gap-1" key={index}>
                {row.map(renderKey)}
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-300 bg-neutral-100 p-2">
            {navigationRows.map((row, index) => (
              <div className="mx-auto mb-1 flex w-fit gap-1 last:mb-0" key={index}>
                {row.map(renderKey)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
