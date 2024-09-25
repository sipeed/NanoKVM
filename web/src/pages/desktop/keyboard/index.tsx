import { useEffect, useRef } from 'react';

import { client } from '@/lib/websocket.ts';

import { KeyboardCodes } from './mappings.ts';

export const Keyboard = () => {
  const isMetaPressedRef = useRef(false);
  const isAltRightPressedRef = useRef(false);

  // listen keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // press button
    function handleKeyDown(event: any) {
      disableEvent(event);

      if (['MetaLeft', 'MetaRight'].includes(event.code)) {
        isMetaPressedRef.current = true;
        return;
      }
      isMetaPressedRef.current = false;

      if (event.code === 'AltRight') {
        isAltRightPressedRef.current = true;
      }

      const code = KeyboardCodes.get(event.code);
      if (!code) {
        console.log('unknown code: ', event.code);
        return;
      }

      const ctrl = event.ctrlKey ? 1 : 0;
      const shift = event.shiftKey ? 1 : 0;
      const alt = event.altKey ? (isAltRightPressedRef.current ? 2 : 1) : 0;
      const meta = event.metaKey ? 1 : 0;

      const data = [1, code, ctrl, shift, alt, meta];
      client.send(data);
    }

    // release button
    function handleKeyUp(event: any) {
      disableEvent(event);

      if (isMetaPressedRef.current) {
        client.send([1, KeyboardCodes.get('MetaLeft')!, 0, 0, 0, 1]);
        isMetaPressedRef.current = false;
      }

      if (event.code === 'AltRight') {
        isAltRightPressedRef.current = false;
      }

      client.send([1, 0, 0, 0, 0, 0]);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // disable the default keyboard events
  function disableEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <></>;
};
