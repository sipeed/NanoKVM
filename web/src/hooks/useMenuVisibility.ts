import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { getMenuDisabledItems, getMenuDisplayMode } from '@/lib/localstorage.ts';
import {
  menuDisabledItemsAtom,
  menuDisplayModeAtom,
  submenuOpenCountAtom
} from '@/jotai/settings.ts';

const HIDE_TIMEOUT = 5000;

export interface MenuVisibilityState {
  isInitialized: boolean;
  isMenuExpanded: boolean;
  isMenuHidden: boolean;
  isMenuMoved: boolean;
  isInvisible: boolean;
  handleHovered: (hovered: boolean) => void;
  handleMoved: () => void;
  setIsMenuExpanded: (expanded: boolean) => void;
}

export function useMenuVisibility(): MenuVisibilityState {
  const [menuDisplayMode, setMenuDisplayMode] = useAtom(menuDisplayModeAtom);
  const setMenuDisabledItems = useSetAtom(menuDisabledItemsAtom);
  const submenuOpenCount = useAtomValue(submenuOpenCountAtom);

  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [isMenuMoved, setIsMenuMoved] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isMenuHidden, setIsMenuHidden] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCountdown = useCallback(() => {
    if (menuDisplayMode !== 'auto' || submenuOpenCount > 0 || !isMenuExpanded || isMenuMoved) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsMenuHidden(true);
    }, HIDE_TIMEOUT);
  }, [menuDisplayMode, submenuOpenCount, isMenuExpanded, isMenuMoved]);

  const stopCountdown = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize menu settings
  useEffect(() => {
    const displayMode = getMenuDisplayMode();
    setMenuDisplayMode(displayMode);

    const items = getMenuDisabledItems();
    setMenuDisabledItems(items);

    if (displayMode === 'off') {
      setIsMenuExpanded(false);
    }

    setIsInitialized(true);

    return () => {
      stopCountdown();
    };
  }, []);

  // Handle display mode changes
  useEffect(() => {
    if (menuDisplayMode === 'off') {
      setIsMenuExpanded(false);
      setIsMenuHidden(false);
      stopCountdown();
    } else if (menuDisplayMode === 'always') {
      setIsMenuExpanded(true);
      setIsMenuHidden(false);
      stopCountdown();
    } else if (menuDisplayMode === 'auto') {
      setIsMenuExpanded(true);
      setIsMenuHidden(false);
      startCountdown();
    }
  }, [menuDisplayMode, startCountdown, stopCountdown]);

  // Handle hover and submenu state
  useEffect(() => {
    if (submenuOpenCount === 0 && !isMenuHovered) {
      startCountdown();
    } else {
      stopCountdown();
    }
  }, [submenuOpenCount, isMenuHovered, startCountdown, stopCountdown]);

  // Handle hover state
  const handleHovered = useCallback((hovered: boolean) => {
    setIsMenuHovered(hovered);
    if (hovered) {
      setIsMenuHidden(false);
    }
  }, []);

  const handleMoved = useCallback(() => {
    if (!isMenuMoved) {
      setIsMenuMoved(true);
    }
  }, [isMenuMoved]);

  const isInvisible = menuDisplayMode === 'off' && !isMenuExpanded;

  return {
    isMenuExpanded,
    isMenuHidden,
    isMenuMoved,
    isInvisible,
    isInitialized,
    handleHovered,
    handleMoved,
    setIsMenuExpanded
  };
}
