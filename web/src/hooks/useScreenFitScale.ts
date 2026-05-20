import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';

import { resolutionAtom } from '@/jotai/screen.ts';

/**
 * Computes a fit-scale so that the remote screen (native resolution) is
 * always contained within the given container element without overflow.
 *
 * Returns 1 when the native resolution is unknown or smaller than the container.
 * The caller should apply:  transform: scale(fitScale * userVideoScale)
 *
 * Mouse coordinate mapping in absolute.tsx remains correct because:
 * - The element keeps its CSS size at native resolution (nativeW × nativeH)
 * - transform: scale(S) makes getBoundingClientRect() return nativeW*S × nativeH*S
 * - getMediaSize() returns the real native size (videoWidth/naturalWidth/canvas.width)
 * - mediaRatio === elementRatio after uniform scale → getCorrectedCoords maps correctly
 */
export function useScreenFitScale(containerRef: React.RefObject<HTMLElement | null>): number {
  const resolution = useAtomValue(resolutionAtom);
  const [fitScale, setFitScale] = useState(1);
  // Keep a stable ref to avoid re-creating the ResizeObserver on every render
  const resolutionRef = useRef(resolution);
  resolutionRef.current = resolution;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function compute() {
      const res = resolutionRef.current;
      if (!res?.width || !res?.height) {
        setFitScale(1);
        return;
      }
      const cw = el!.clientWidth;
      const ch = el!.clientHeight;
      if (cw === 0 || ch === 0) return;
      setFitScale(Math.min(cw / res.width, ch / res.height));
    }

    compute();

    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  // Also recompute when resolution changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !resolution?.width || !resolution?.height) {
      setFitScale(1);
      return;
    }
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw === 0 || ch === 0) return;
    setFitScale(Math.min(cw / resolution.width, ch / resolution.height));
  }, [containerRef, resolution]);

  return fitScale;
}
