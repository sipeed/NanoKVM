import React, { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';

import * as api from '@/api/hid.ts';
import { isModifier } from '@/lib/keymap';
import { leaderKeyAtom } from '@/jotai/keyboard.ts';

interface LeaderKeyState {
  code: string;
  startTime: number;
  recordMode: boolean;
  recordModifiers: string[];
}

interface LeaderKeyHandlers {
  handleKeyDown: (code: string) => boolean;
  handleKeyUp: (code: string) => boolean;
  reset: () => void;
  recordMode: boolean;
  recordedKeys: string[];
}

const RECORD_MODE_THRESHOLD_MS = 350;

export function useLeaderKey(
  pressedKeys: React.MutableRefObject<Set<string>>,
  sendKeyEvent: (type: 'keydown' | 'keyup', code: string) => void
): LeaderKeyHandlers {
  const [leaderKeyCode, setLeaderKeyCode] = useAtom(leaderKeyAtom);

  const [recordMode, setRecordMode] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);

  const leaderState = useRef<LeaderKeyState>({
    code: '',
    startTime: 0,
    recordMode: false,
    recordModifiers: []
  });

  // Get leader key
  useEffect(() => {
    api.getLeaderKey().then((rsp: any) => {
      if (rsp.code === 0 && rsp.data?.key !== undefined) {
        setLeaderKeyCode(rsp.data.key);
      }
    });
  }, [setLeaderKeyCode]);

  // Update leader key
  useEffect(() => {
    leaderState.current.code = leaderKeyCode;
  }, [leaderKeyCode]);

  const handleKeyDown = (code: string): boolean => {
    const leader = leaderState.current;

    // Leader key pressed
    if (leader.code && code === leader.code) {
      if (!leader.recordMode) {
        // Enter record mode
        leader.startTime = Date.now();
        leader.recordMode = true;
        setRecordMode(true);
      }

      pressedKeys.current.add(code);
      return true;
    }

    // Record mode
    if (leader.recordMode) {
      if (isModifier(code)) {
        // Modifier: send keydown immediately and track it
        if (!leader.recordModifiers.includes(code)) {
          leader.recordModifiers.push(code);
          setRecordedKeys([...leaderState.current.recordModifiers]);
          sendKeyEvent('keydown', code);
        }
      } else {
        // Non-modifier: send keydown + keyup immediately
        sendKeyEvent('keydown', code);
        sendKeyEvent('keyup', code);
      }

      pressedKeys.current.add(code);
      return true;
    }

    return false;
  };

  const handleKeyUp = (code: string): boolean => {
    const leader = leaderState.current;

    // Leader key released
    if (leader.code && code === leader.code) {
      if (leader.recordMode && Date.now() - leader.startTime > RECORD_MODE_THRESHOLD_MS) {
        // Exit record mode
        reset();
      }

      pressedKeys.current.delete(code);
      return true;
    }

    // In record mode, handle keyup
    if (leader.recordMode && code !== leader.code) {
      pressedKeys.current.delete(code);
      return true;
    }

    return false;
  };

  const reset = () => {
    const leader = leaderState.current;

    for (const key of leader.recordModifiers) {
      sendKeyEvent('keyup', key);
    }

    leader.startTime = 0;
    leader.recordMode = false;
    leader.recordModifiers = [];

    setRecordMode(false);
    setRecordedKeys([]);
  };

  return { handleKeyDown, handleKeyUp, reset, recordMode, recordedKeys };
}
