import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import {
  controlRegionModeAtom,
  inputRegionAtom,
  manualRegionsAtom,
  selectedManualRegionAtom,
  selectedOriginalResolutionAtom
} from '@/jotai/screen.ts';

import { getCenteredInputRegionByAspectRatio, getMediaSize } from './geometry.ts';

export const ManualRegion = () => {
  const mode = useAtomValue(controlRegionModeAtom);
  const selectedOriginal = useAtomValue(selectedOriginalResolutionAtom);
  const selectedManual = useAtomValue(selectedManualRegionAtom);
  const manualRegions = useAtomValue(manualRegionsAtom);
  const setInputRegion = useSetAtom(inputRegionAtom);

  useEffect(() => {
    if (mode !== 'manual') return;
    if (selectedManual) {
      setInputRegion(
        manualRegions.find((region) => `${region.width}x${region.height}` === selectedManual) ||
          null
      );
      return;
    }

    if (!selectedOriginal) {
      setInputRegion(null);
      return;
    }

    const [width, height] = selectedOriginal.split('x').map(Number);
    if (!width || !height) {
      setInputRegion(null);
      return;
    }

    const update = () => {
      const target = document.getElementById('screen');
      if (!target) return;
      const mediaSize = getMediaSize(target);
      setInputRegion(
        mediaSize ? getCenteredInputRegionByAspectRatio(width, height, mediaSize) : null
      );
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => {
      window.clearInterval(timer);
    };
  }, [manualRegions, mode, selectedManual, selectedOriginal, setInputRegion]);

  return null;
};
