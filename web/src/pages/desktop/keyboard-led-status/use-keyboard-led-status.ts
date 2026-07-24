import { useEffect, useRef, useState } from 'react';

import { getKeyboardLedStatus } from '@/api/hid.ts';
import { client } from '@/lib/websocket.ts';

import {
  KEYBOARD_LED_STATUS_EVENT,
  KeyboardLedStatus,
  parseKeyboardLedStatus,
  parseKeyboardLedStatusMessage,
  shouldAcceptKeyboardLedStatus
} from './model';

export function useKeyboardLedStatus() {
  const [status, setStatus] = useState<KeyboardLedStatus | null>(null);
  const latestStatusRef = useRef<KeyboardLedStatus | null>(null);

  useEffect(() => {
    let disposed = false;

    function update(next: KeyboardLedStatus) {
      if (!shouldAcceptKeyboardLedStatus(latestStatusRef.current, next)) {
        return;
      }

      latestStatusRef.current = next;
      setStatus(next);
    }

    const unsubscribe = client.on(KEYBOARD_LED_STATUS_EVENT, (message) => {
      const next = parseKeyboardLedStatusMessage(message);
      if (next) {
        update(next);
      }
    });

    getKeyboardLedStatus()
      .then((rsp) => {
        const next = parseKeyboardLedStatus(rsp.data);
        if (!disposed && next) {
          update(next);
        }
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  return status;
}
