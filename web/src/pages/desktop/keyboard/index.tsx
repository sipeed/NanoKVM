import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';

import { KeyboardReport } from '@/lib/keyboard.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

export const Keyboard = () => {
  const isKeyboardEnabled = useAtomValue(isKeyboardEnableAtom);

  const keyboardRef = useRef(new KeyboardReport());
  const pressedKeys = useRef(new Set<string>());

  useEffect(() => {
    if (!isKeyboardEnabled) {
      releaseKeys();
      return;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Key down event
    function handleKeyDown(event: KeyboardEvent) {
      if (!isKeyboardEnabled) return;

      event.preventDefault();
      event.stopPropagation();

      const code = event.code;
      if (pressedKeys.current.has(code)) {
        return;
      }

      pressedKeys.current.add(code);
      handleKeyEvent({ type: 'keydown', code });
    }

    // Key up event
    function handleKeyUp(event: KeyboardEvent) {
      if (!isKeyboardEnabled) return;

      event.preventDefault();
      event.stopPropagation();

      const code = event.code;
      pressedKeys.current.delete(code);
      handleKeyEvent({ type: 'keyup', code });
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

      const report = keyboardRef.current.reset();
      sendReport(report);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
