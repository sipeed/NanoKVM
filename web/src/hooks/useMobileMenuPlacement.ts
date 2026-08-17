import { useCallback, useEffect, useMemo, useState } from 'react';

import * as storage from '@/lib/localstorage.ts';
import {
  getInitialMobileMenuPlacement,
  MobileMenuEdge,
  MobileMenuPlacement
} from '@/lib/mobile-layout.ts';

const MOBILE_MENU_EXPANDED_HEIGHT = 480;

function getViewportHeight() {
  if (typeof window === 'undefined') {
    return 800;
  }

  return window.innerHeight;
}

export function useMobileMenuPlacement() {
  const [viewportHeight, setViewportHeight] = useState(getViewportHeight);
  const [placement, setPlacement] = useState<MobileMenuPlacement>(() =>
    getInitialMobileMenuPlacement(
      storage.getMobileMenuPlacement(),
      getViewportHeight(),
      MOBILE_MENU_EXPANDED_HEIGHT
    )
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(getViewportHeight());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const normalizedPlacement = useMemo(
    () =>
      getInitialMobileMenuPlacement(
        { edge: placement.edge, top: placement.top },
        viewportHeight,
        MOBILE_MENU_EXPANDED_HEIGHT
      ),
    [placement.edge, placement.top, viewportHeight]
  );

  useEffect(() => {
    setPlacement((current) => {
      if (current.edge === normalizedPlacement.edge && current.top === normalizedPlacement.top) {
        return current;
      }

      return normalizedPlacement;
    });
  }, [normalizedPlacement]);

  const updatePlacement = useCallback((edge: MobileMenuEdge, top: number) => {
    const nextPlacement = getInitialMobileMenuPlacement(
      { edge, top },
      getViewportHeight(),
      MOBILE_MENU_EXPANDED_HEIGHT
    );
    setPlacement(nextPlacement);
    storage.setMobileMenuPlacement(nextPlacement);
  }, []);

  return {
    placement: normalizedPlacement,
    updatePlacement
  };
}
