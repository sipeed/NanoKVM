import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { hidStateAtom } from '@/jotai/mouse.ts';

import { client } from '@/lib/websocket.ts';

import { KeyboardCodes, ModifierCodes } from './mappings.ts';

export const Keyboard = () => {
  const lastCodeRef = useRef('');
  const hidEnable = useAtomValue(hidStateAtom);
  const modifierRef = useRef({
    ctrl: 0,
    shift: 0,
    alt: 0,
    meta: 0
  });

  // listen keyboard events
  useEffect(() => {
    if (!hidEnable) return;
    
    const modifiers = ['Control', 'Shift', 'Alt', 'Meta'];

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // press button
    function handleKeyDown(event: KeyboardEvent) {
      disableEvent(event);

      lastCodeRef.current = event.code;

      if (modifiers.includes(event.key)) {
        const code = ModifierCodes.get(event.code)!;
        setModifier(event.key, code);

        if (event.key === 'Meta') {
          return;
        }
      }

      sendKeyDown(event);
    }

    // release button
    function handleKeyUp(event: KeyboardEvent) {
      disableEvent(event);

      if (modifiers.includes(event.key)) {
        if (event.key === 'Meta' && lastCodeRef.current === event.code) {
          sendKeyDown(event, true);
          sendKeyUp();
        }

        setModifier(event.key, 0);
      }

      if (event.key !== 'Meta') {
        sendKeyUp();
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hidEnable]);

  function setModifier(key: string, code: number) {
    switch (key) {
      case 'Control':
        modifierRef.current.ctrl = code;
        break;
      case 'Alt':
        modifierRef.current.alt = code;
        break;
      case 'Shift':
        modifierRef.current.shift = code;
        break;
      case 'Meta':
        modifierRef.current.meta = code;
        break;
      default:
        console.log('unknown key: ', key);
    }
  }

  function sendKeyDown(event: KeyboardEvent, isMeta?: boolean) {
    const code = KeyboardCodes.get(event.code);
    if (!code) {
      console.log('unknown code: ', event.code);
      return;
    }

    const ctrl = event.ctrlKey ? modifierRef.current.ctrl || 1 : 0;
    const shift = event.shiftKey ? modifierRef.current.shift || 2 : 0;
    const alt = event.altKey ? modifierRef.current.alt || 4 : 0;
    const meta = event.metaKey || isMeta ? modifierRef.current.meta || 8 : 0;

    client.send([1, code, ctrl, shift, alt, meta]);
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
