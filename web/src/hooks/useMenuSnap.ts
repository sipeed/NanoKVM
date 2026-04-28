import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import {
  getMenuSnapEdge,
  getMenuSnapOffset,
  setMenuSnapEdge,
  setMenuSnapOffset,
  type SnapEdge
} from '@/lib/localstorage.ts';

/** Distance from each edge (px) that triggers snap */
const SNAP_THRESHOLD = 80;
/** How many px of the panel remain visible when snapped (the "indicator strip") */
export const SNAP_PEEK = 6;
/** Hover zone width (px) on the indicator strip to trigger pop-out */
export const SNAP_HOVER_ZONE = 28;

export interface SnapState {
  edge: SnapEdge;
  /** normalised position along the perpendicular axis [0,1] */
  offset: number;
}

export interface UseMenuSnapReturn {
  snapState: SnapState;
  isSnapHovered: boolean;
  /** Call at drag-stop with node rect + final absolute position */
  onDragStop: (nodeRef: RefObject<HTMLElement | null>) => void;
  /** Update hover state when mouse enters/leaves indicator */
  setSnapHovered: (v: boolean) => void;
  /** Un-snap (release from edge) */
  clearSnap: () => void;
}

export function useMenuSnap(): UseMenuSnapReturn {
  const [snapState, setSnapState] = useState<SnapState>(() => ({
    edge: getMenuSnapEdge(),
    offset: getMenuSnapOffset()
  }));
  const [isSnapHovered, setIsSnapHoveredRaw] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist whenever snap changes
  useEffect(() => {
    setMenuSnapEdge(snapState.edge);
    setMenuSnapOffset(snapState.offset);
  }, [snapState]);

  const onDragStop = useCallback((nodeRef: RefObject<HTMLElement | null>) => {
    const el = nodeRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Distances from each edge
    const dTop = rect.top;
    const dBottom = vh - rect.bottom;
    const dLeft = rect.left;
    const dRight = vw - rect.right;

    const min = Math.min(dTop, dBottom, dLeft, dRight);

    if (min > SNAP_THRESHOLD) {
      // Not close enough to any edge — clear snap
      setSnapState({ edge: null, offset: 0.5 });
      return;
    }

    let edge: SnapEdge = null;
    let offset = 0.5;

    if (min === dTop) {
      edge = 'top';
      offset = (rect.left + rect.width / 2) / vw;
    } else if (min === dBottom) {
      edge = 'bottom';
      offset = (rect.left + rect.width / 2) / vw;
    } else if (min === dLeft) {
      edge = 'left';
      offset = (rect.top + rect.height / 2) / vh;
    } else {
      edge = 'right';
      offset = (rect.top + rect.height / 2) / vh;
    }

    offset = Math.max(0.05, Math.min(0.95, offset));
    setSnapState({ edge, offset });
  }, []);

  const setSnapHovered = useCallback((v: boolean) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (v) {
      setIsSnapHoveredRaw(true);
    } else {
      // Small delay before hiding so cursor can travel to the expanded panel
      hoverTimerRef.current = setTimeout(() => {
        setIsSnapHoveredRaw(false);
      }, 300);
    }
  }, []);

  const clearSnap = useCallback(() => {
    setSnapState({ edge: null, offset: 0.5 });
    setIsSnapHoveredRaw(false);
  }, []);

  return { snapState, isSnapHovered, onDragStop, setSnapHovered, clearSnap };
}
