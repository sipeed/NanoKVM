import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { picoclawOverlayAtom, picoclawTakeoverStateAtom } from '@/jotai/picoclaw.ts';

type ScreenRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const ActionOverlay = () => {
  const { t } = useTranslation();
  const overlay = useAtomValue(picoclawOverlayAtom);
  const takeover = useAtomValue(picoclawTakeoverStateAtom);
  const [rect, setRect] = useState<ScreenRect | null>(null);

  useEffect(() => {
    const screen = document.getElementById('screen');
    if (!screen) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const bounds = screen.getBoundingClientRect();
      setRect({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height
      });
    };

    updateRect();

    const observer = new ResizeObserver(updateRect);
    observer.observe(screen);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [takeover.active]);

  if (!takeover.active || !rect || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return (
    <div
      className="fixed z-[950]"
      style={{
        left: rect.left + 12,
        top: rect.top + 12
      }}
    >
      <div className="rounded-full bg-neutral-950/85 px-3 py-1 text-xs text-sky-100 shadow-lg ring-1 ring-sky-400/30">
        {overlay.message || t('picoclaw.overlay.locked')}
      </div>
    </div>
  );
};
