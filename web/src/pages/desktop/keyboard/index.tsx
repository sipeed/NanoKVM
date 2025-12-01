import { useEffect, useRef } from 'react';

import { client } from '@/lib/websocket.ts';

import { KeyboardCodes } from './mappings.ts';

export const Keyboard = () => {
  const pressedKeys = useRef<Set<string>>(new Set());

  // listen keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', releaseAllKeys);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // press button
    function handleKeyDown(event: KeyboardEvent) {
      disableEvent(event);

      if (!pressedKeys.current.has(event.code)) {
        pressedKeys.current.add(event.code);
      }

      sendKeyDown(event);
    }

    // release button
    function handleKeyUp(event: KeyboardEvent) {
      disableEvent(event);

      if (pressedKeys.current.has(event.code)) {
        pressedKeys.current.delete(event.code);
      }

      sendKeyUp();
    }

    function releaseAllKeys() {
      if (pressedKeys.current.size === 0) {
        return;
      }

      sendKeyUp();
      pressedKeys.current.clear();
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        releaseAllKeys();
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', releaseAllKeys);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  function sendKeyDown(event: KeyboardEvent) {
    const code = KeyboardCodes.get(event.code);
    if (!code) {
      console.log('unknown code: ', event.code);
      return;
    }

    let ctrl = 0;
    if (event.ctrlKey) {
      if (pressedKeys.current.has('ControlLeft')) {
        ctrl = 1;
      } else if (pressedKeys.current.has('ControlRight')) {
        ctrl = 16;
      } else if (pressedKeys.current.has('AltRight')) {
        ctrl = 0;
      } else {
        ctrl = 1;
      }
    }

    const modifiers = [
      ctrl,
      event.shiftKey ? (pressedKeys.current.has('ShiftRight') ? 32 : 2) : 0,
      event.altKey ? (pressedKeys.current.has('AltRight') ? 64 : 4) : 0,
      event.metaKey ? (pressedKeys.current.has('MetaRight') ? 128 : 8) : 0
    ];

    client.send([1, code, ...modifiers]);
  }

  function sendKeyUp() {
    client.send([1, 0, 0, 0, 0, 0]);
  }

  // disable the default keyboard events
  function disableEvent(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <></>;
};
