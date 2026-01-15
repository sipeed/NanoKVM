import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';

import { getOperatingSystem } from '@/lib/browser.ts';
import { KeyboardReport } from '@/lib/keyboard.ts';
import { isModifier } from '@/lib/keymap';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

interface AltGrState {
  active: boolean;
  ctrlLeftTimestamp: number;
}

const ALTGR_THRESHOLD_MS = 10;

export const Keyboard = () => {
  const isKeyboardEnabled = useAtomValue(isKeyboardEnableAtom);

  const keyboardRef = useRef(new KeyboardReport());
  const pressedKeys = useRef(new Set<string>());
  const altGrState = useRef<AltGrState | null>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    if (getOperatingSystem() === 'Windows' && !altGrState.current) {
      altGrState.current = { active: false, ctrlLeftTimestamp: 0 };
    }

    if (!isKeyboardEnabled) {
      releaseKeys();
      return;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('compositionstart', handleCompositionStart);
    document.addEventListener('compositionend', handleCompositionEnd);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Key down event
    function handleKeyDown(event: KeyboardEvent) {
      if (!isKeyboardEnabled) return;

      // Skip during IME composition
      if (isComposing.current || event.isComposing) return;

      event.preventDefault();
      event.stopPropagation();

      const code = event.code;
      if (pressedKeys.current.has(code)) return;

      // When AltGr is pressed, browsers send ControlLeft followed immediately by AltRight
      if (altGrState.current) {
        if (code === 'ControlLeft') {
          altGrState.current.ctrlLeftTimestamp = event.timeStamp;
        } else if (code === 'AltRight') {
          const timeDiff = event.timeStamp - altGrState.current.ctrlLeftTimestamp;
          if (timeDiff < ALTGR_THRESHOLD_MS && pressedKeys.current.has('ControlLeft')) {
            pressedKeys.current.delete('ControlLeft');
            handleKeyEvent({ type: 'keyup', code: 'ControlLeft' });
            altGrState.current.active = true;
          }
        }
      }

      pressedKeys.current.add(code);
      handleKeyEvent({ type: 'keydown', code });
    }

    // Key up event
    function handleKeyUp(event: KeyboardEvent) {
      if (!isKeyboardEnabled) return;

      if (isComposing.current || event.isComposing) return;

      event.preventDefault();
      event.stopPropagation();

      const code = event.code;

      // Handle AltGr state for Windows
      if (altGrState.current?.active) {
        if (code === 'ControlLeft') return;

        if (code === 'AltRight') {
          altGrState.current.active = false;
        }
      }

      // Compatible with macOS's command key combinations
      if (code === 'MetaLeft' || code === 'MetaRight') {
        const keysToRelease: string[] = [];
        pressedKeys.current.forEach((pressedCode) => {
          if (!isModifier(pressedCode)) {
            keysToRelease.push(pressedCode);
          }
        });

        for (const key of keysToRelease) {
          handleKeyEvent({ type: 'keyup', code: key });
          pressedKeys.current.delete(key);
        }
      }

      pressedKeys.current.delete(code);
      handleKeyEvent({ type: 'keyup', code });
    }

    // Composition start event
    function handleCompositionStart() {
      isComposing.current = true;
    }

    // Composition end event
    function handleCompositionEnd() {
      isComposing.current = false;
    }

    // Release all keys when window loses focus
    function handleBlur() {
      releaseKeys();
    }

    // Release all keys before window closes
    function handleVisibilityChange() {
      if (document.hidden) {
        releaseKeys();
      }
    }

    // Release all keys
    function releaseKeys() {
      pressedKeys.current.forEach((code) => {
        handleKeyEvent({ type: 'keyup', code });
      });

      pressedKeys.current.clear();

      // Reset AltGr state
      if (altGrState.current) {
        altGrState.current.active = false;
        altGrState.current.ctrlLeftTimestamp = 0;
      }

      const report = keyboardRef.current.reset();
      sendReport(report);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('compositionstart', handleCompositionStart);
      document.removeEventListener('compositionend', handleCompositionEnd);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      releaseKeys();
    };
  }, [isKeyboardEnabled]);

  // Keyboard handler
  function handleKeyEvent(event: { type: 'keydown' | 'keyup'; code: string }) {
    const kb = keyboardRef.current;
    const report = event.type === 'keydown' ? kb.keyDown(event.code) : kb.keyUp(event.code);
    sendReport(report);
  }

  // Send keyboard report
  function sendReport(report: Uint8Array) {
    const data = new Uint8Array([MessageEvent.Keyboard, ...report]);
    client.send(data);
  }

  return <></>;
};
