import React, { useRef } from 'react';

const ALTGR_THRESHOLD_MS = 10;

interface AltGrState {
  active: boolean;
  ctrlLeftTimestamp: number;
}

export interface AltGrHandlers {
  handleKeyDown: (code: string, timestamp: number) => void;
  handleKeyUp: (code: string) => boolean;
  reset: () => void;
  isActive: () => boolean;
}

export function useAltGr(
  os: string,
  pressedKeys: React.MutableRefObject<Set<string>>,
  sendKeyEvent: (type: 'keydown' | 'keyup', code: string) => void
): AltGrHandlers {
  const state = useRef<AltGrState | null>(null);

  if (os === 'Windows' && !state.current) {
    state.current = { active: false, ctrlLeftTimestamp: 0 };
  }

  const handleKeyDown = (code: string, timestamp: number): void => {
    if (!state.current) return;

    // When AltGr is pressed, browsers send ControlLeft followed immediately by AltRight
    if (code === 'ControlLeft') {
      state.current.ctrlLeftTimestamp = timestamp;
      return;
    }

    if (code === 'AltRight') {
      const timeDiff = timestamp - state.current.ctrlLeftTimestamp;
      if (timeDiff < ALTGR_THRESHOLD_MS && pressedKeys.current.has('ControlLeft')) {
        pressedKeys.current.delete('ControlLeft');
        sendKeyEvent('keyup', 'ControlLeft');
        state.current.active = true;
        return;
      }
    }
  };

  const handleKeyUp = (code: string): boolean => {
    if (!state.current?.active) {
      return false;
    }

    if (code === 'ControlLeft') {
      pressedKeys.current.delete('ControlLeft');
      return true;
    }

    if (code === 'AltRight') {
      pressedKeys.current.delete('ControlLeft');
      state.current.active = false;
      return false;
    }

    return false;
  };

  const reset = () => {
    if (state.current) {
      state.current.active = false;
      state.current.ctrlLeftTimestamp = 0;
    }
  };

  const isActive = () => state.current?.active ?? false;

  return { handleKeyDown, handleKeyUp, reset, isActive };
}
