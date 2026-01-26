import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';

import { getOperatingSystem } from '@/lib/browser.ts';
import { KeyboardReport } from '@/lib/keyboard.ts';
import { isModifier } from '@/lib/keymap';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

import { Recorder } from './recorder.tsx';
import { useAltGr } from './useAltGr.ts';
import { useLeaderKey } from './useLeaderKey.ts';
import { normalizeKeyCode } from './utils.ts';

export const Keyboard = () => {
  const os = getOperatingSystem();

  const isKeyboardEnabled = useAtomValue(isKeyboardEnableAtom);

  const keyboardRef = useRef(new KeyboardReport());
  const pressedKeys = useRef(new Set<string>());
  const isComposing = useRef(false);

  // Send key event helper
  const sendKeyEvent = (type: 'keydown' | 'keyup', code: string) => {
    const kb = keyboardRef.current;
    const report = type === 'keydown' ? kb.keyDown(code) : kb.keyUp(code);
    sendReport(report);
  };

  // Init leader key handler
  const leaderKey = useLeaderKey(pressedKeys, sendKeyEvent);
  const leaderKeyRef = useRef(leaderKey);
  leaderKeyRef.current = leaderKey;

  // Init AltGr key handler
  const altGr = useAltGr(os, pressedKeys, sendKeyEvent);
  const altGrRef = useRef(altGr);
  altGrRef.current = altGr;

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('compositionstart', handleCompositionStart);
    document.addEventListener('compositionend', handleCompositionEnd);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    function handleKeyDown(event: KeyboardEvent) {
      if (!isKeyboardEnabled) return;
      if (isComposing.current || event.isComposing) return;

      event.preventDefault();
      event.stopPropagation();

      const code = normalizeKeyCode(event, os);
      if (!code || pressedKeys.current.has(code)) return;

      // Handle leader key
      const leaderHandled = leaderKeyRef.current.handleKeyDown(code);
      if (leaderHandled) {
        return;
      }

      // Handle AltGr key
      altGrRef.current.handleKeyDown(code, event.timeStamp);

      pressedKeys.current.add(code);
      sendKeyEvent('keydown', code);
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (!isKeyboardEnabled) return;
      if (isComposing.current || event.isComposing) return;

      event.preventDefault();
      event.stopPropagation();

      const code = normalizeKeyCode(event, os);
      if (!code) return;

      // Handle leader key release
      const leaderHandled = leaderKeyRef.current.handleKeyUp(code);
      if (leaderHandled) {
        return;
      }

      // Handle AltGr key release
      const altGrHandled = altGrRef.current.handleKeyUp(code);
      if (altGrHandled) {
        return;
      }

      // Release Meta combinations (macOS compatibility)
      if (code === 'MetaLeft' || code === 'MetaRight') {
        releaseMetaCombinations();
      }

      pressedKeys.current.delete(code);
      sendKeyEvent('keyup', code);
    }

    function handleCompositionStart() {
      isComposing.current = true;
    }

    function handleCompositionEnd() {
      isComposing.current = false;
    }

    function handleBlur() {
      releaseKeys();
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        releaseKeys();
      }
    }

    function releaseMetaCombinations() {
      const keysToRelease = Array.from(pressedKeys.current).filter((code) => !isModifier(code));
      for (const key of keysToRelease) {
        sendKeyEvent('keyup', key);
        pressedKeys.current.delete(key);
      }
    }

    function releaseKeys() {
      pressedKeys.current.forEach((code) => {
        sendKeyEvent('keyup', code);
      });
      pressedKeys.current.clear();

      leaderKeyRef.current.reset();
      altGrRef.current.reset();

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

  function sendReport(report: Uint8Array) {
    const data = new Uint8Array([MessageEvent.Keyboard, ...report]);
    client.send(data);
  }

  return (
    <>
      <Recorder recordMode={leaderKey.recordMode} recordedKeys={leaderKey.recordedKeys} />
    </>
  );
};
