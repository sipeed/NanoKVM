import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import {
  controlRegionModeAtom,
  inputRegionAtom,
  manualInputRegionAtom,
  selectedOriginalResolutionAtom
} from '@/jotai/screen.ts';

import { getCenteredInputRegionByAspectRatio, getMediaSize } from './geometry.ts';

export const ManualRegion = () => {
  const mode = useAtomValue(controlRegionModeAtom);
  const selected = useAtomValue(selectedOriginalResolutionAtom);
  const manualRegion = useAtomValue(manualInputRegionAtom);
  const setInputRegion = useSetAtom(inputRegionAtom);

  useEffect(() => {
    if (mode !== 'manual') return;
    if (!selected) {
      setInputRegion(manualRegion);
      return;
    }

    const [width, height] = selected.split('x').map(Number);
    if (manualRegion?.width === width && manualRegion.height === height) {
      setInputRegion(manualRegion);
      return;
    }
    const screen = document.getElementById('screen');
    if (!screen || !width || !height) {
      setInputRegion(null);
      return;
    }
    const target = screen;
    const update = () => {
      const mediaSize = getMediaSize(target);
      setInputRegion(
        mediaSize ? getCenteredInputRegionByAspectRatio(width, height, mediaSize) : null
      );
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(target, {
      attributes: true,
      attributeFilter: ['data-media-width', 'data-media-height']
    });
    target.addEventListener('load', update);
    target.addEventListener('loadedmetadata', update);
    target.addEventListener('canplay', update);
    target.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      target.removeEventListener('load', update);
      target.removeEventListener('loadedmetadata', update);
      target.removeEventListener('canplay', update);
      target.removeEventListener('resize', update);
    };
  }, [manualRegion, mode, selected, setInputRegion]);

  return null;
};
