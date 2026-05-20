import { RefObject, useCallback, useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';

import { menuDisabledItemsAtom } from '@/jotai/settings.ts';

export interface MenuBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function useMenuBounds(
  nodeRef: RefObject<HTMLDivElement | null>,
  isMenuExpanded: boolean
): MenuBounds {
  const menuDisabledItems = useAtomValue(menuDisabledItemsAtom);
  const [menuBounds, setMenuBounds] = useState<MenuBounds>(() => {
    const hw = window.innerWidth / 2;
    const hh = window.innerHeight;
    return { left: -hw, right: hw, top: -100, bottom: hh };
  });

  const handleResize = useCallback(() => {
    if (!nodeRef.current) return;

    const elementRect = nodeRef.current.getBoundingClientRect();
    const width = (window.innerWidth - elementRect.width) / 2;

    setMenuBounds({
      left: -width,
      top: -10,
      right: width,
      bottom: window.innerHeight - elementRect.height - 10
    });
  }, [nodeRef]);

  // Update bounds on mount and resize
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Update bounds when menu items or expansion state change
  useEffect(() => {
    handleResize();
  }, [menuDisabledItems, isMenuExpanded, handleResize]);

  return menuBounds;
}
