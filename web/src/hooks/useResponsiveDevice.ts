import { useCallback, useEffect, useState } from 'react';

import { getResponsiveDeviceState, ResponsiveDeviceState } from '@/lib/mobile-layout.ts';

const initialState: ResponsiveDeviceState = {
  isTouchLikeDevice: false,
  isPortraitViewport: false,
  isLandscapeViewport: true,
  isMobilePortrait: false
};

function getState(): ResponsiveDeviceState {
  if (typeof window === 'undefined') {
    return initialState;
  }

  return getResponsiveDeviceState({
    width: window.innerWidth,
    height: window.innerHeight,
    hasTouch: navigator.maxTouchPoints > 0,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    userAgent: navigator.userAgent
  });
}

export function useResponsiveDevice() {
  const [state, setState] = useState(getState);

  const updateState = useCallback(() => {
    setState(getState());
  }, []);

  useEffect(() => {
    updateState();
    window.addEventListener('resize', updateState);
    window.addEventListener('orientationchange', updateState);

    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
    };
  }, [updateState]);

  return state;
}
