import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import {
  controlRegionModeAtom,
  inputRegionAtom,
  inputRegionSelectingAtom
} from '@/jotai/screen.ts';

import { detectFrameContent, getMediaSize } from './geometry.ts';

export const AutoRegion = () => {
  const mode = useAtomValue(controlRegionModeAtom);
  const selecting = useAtomValue(inputRegionSelectingAtom);
  const setInputRegion = useSetAtom(inputRegionAtom);

  useEffect(() => {
    if (mode !== 'auto' || selecting) {
      return;
    }

    let stopped = false;
    let target: Element | null = null;
    let candidate = '';
    let confirmations = 0;

    const detect = () => {
      if (stopped) return;

      const screen = document.getElementById('screen');
      if (!screen) return;
      if (screen !== target) {
        target = screen;
        candidate = '';
        confirmations = 0;
      }

      const mediaSize = getMediaSize(screen);
      if (!mediaSize) return;
      const content = detectFrameContent(screen, mediaSize);
      const key = [
        mediaSize.width,
        mediaSize.height,
        content.left,
        content.top,
        content.width,
        content.height
      ]
        .map(Math.round)
        .join(':');
      if (candidate === key) {
        confirmations += 1;
      } else {
        candidate = key;
        confirmations = 1;
      }
      if (confirmations === 3) {
        setInputRegion({
          frameWidth: mediaSize.width,
          frameHeight: mediaSize.height,
          left: Math.round(content.left),
          top: Math.round(content.top),
          width: Math.round(content.width),
          height: Math.round(content.height)
        });
      }
    };

    detect();
    const timer = window.setInterval(detect, 1000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [mode, selecting, setInputRegion]);

  useEffect(() => {
    if (mode !== 'auto') setInputRegion(null);
  }, [mode, setInputRegion]);

  return null;
};
