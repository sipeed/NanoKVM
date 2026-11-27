import { Tooltip } from 'antd';
import clsx from 'clsx';

import { useKeyboardLedStatus } from './use-keyboard-led-status';

const LOCK_INDICATORS = {
  numLock: { label: 'Num Lock', shortLabel: 'Num', microLabel: '1' },
  capsLock: { label: 'Caps Lock', shortLabel: 'Caps', microLabel: 'A' },
  scrollLock: { label: 'Scroll Lock', shortLabel: 'Scr', microLabel: '⤓' }
} as const;

type LockIndicatorProps = {
  labelKey: 'numLock' | 'capsLock' | 'scrollLock';
  active: boolean;
  known: boolean;
};

function LockIndicator({ labelKey, active, known }: LockIndicatorProps) {
  const { label, shortLabel, microLabel } = LOCK_INDICATORS[labelKey];
  const state = known ? (active ? 'On' : 'Off') : 'Unknown';
  const indicatorLabel = `${label}: ${state}`;

  return (
    <Tooltip
      title={indicatorLabel}
      placement="bottom"
      mouseEnterDelay={0.6}
    >
      <div
        className="flex h-[8px] items-center gap-1 px-1 text-[8px] font-medium leading-[8px] text-neutral-400"
        aria-label={indicatorLabel}
        role="img"
      >
        <span
          aria-hidden="true"
          className={clsx(
            'flex h-2 w-2 items-center justify-center rounded-full text-[7px] leading-none',
            known
              ? active
                ? 'bg-green-600'
                : 'bg-neutral-600'
              : 'border border-dashed border-neutral-500 text-neutral-300'
          )}
        >
          { known 
              ? <span className="text-neutral-900 sm:hidden inline">{microLabel}</span>
              : '?'
          }
        </span>
        <span className="hidden sm:inline">{shortLabel}</span>
      </div>
    </Tooltip>
  );
}

export function KeyboardLedStatus() {
  const status = useKeyboardLedStatus();
  const known = status?.known ?? false;

  return (
    <div
      className="flex h-full gap-[2px] font-mono w-[16px] sm:w-[40px] flex-col items-start justify-center rounded bg-neutral-800/80"
      aria-label="Keyboard lock status"
      role="group"
    >
      <LockIndicator labelKey="numLock" active={status?.numLock ?? false} known={known} />
      <LockIndicator labelKey="capsLock" active={status?.capsLock ?? false} known={known} />
      <LockIndicator labelKey="scrollLock" active={status?.scrollLock ?? false} known={known} />
    </div>
  );
}
