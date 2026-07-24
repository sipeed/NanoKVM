import { Tooltip } from 'antd';
import clsx from 'clsx';

import { useKeyboardLedStatus } from './use-keyboard-led-status';

type LockIndicatorProps = {
  label: string;
  active: boolean;
  known: boolean;
};

function LockIndicator({ label, active, known }: LockIndicatorProps) {
  const state = known ? (active ? 'On' : 'Off') : 'Unknown';

  return (
    <Tooltip title={`${label}: ${state}`} placement="bottom" mouseEnterDelay={0.6}>
      <div className="flex h-[8px] items-center gap-1 px-1 text-[8px] font-medium leading-[8px] text-neutral-400">
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full',
            known
              ? active
                ? 'bg-emerald-400'
                : 'bg-neutral-600'
              : 'border border-dashed border-neutral-500'
          )}
        />
        <span className="hidden sm:inline">
          {label === 'Scroll Lock' ? 'Scr' : label.replace(' Lock', '')}
        </span>
      </div>
    </Tooltip>
  );
}

export function KeyboardLedStatus() {
  const status = useKeyboardLedStatus();
  const known = status?.known ?? false;

  return (
    <div
      className="flex h-full w-[40px] flex-col items-start justify-center rounded bg-neutral-800/80"
      aria-label="Remote keyboard lock status"
    >
      <LockIndicator label="Num Lock" active={status?.numLock ?? false} known={known} />
      <LockIndicator label="Caps Lock" active={status?.capsLock ?? false} known={known} />
      <LockIndicator label="Scroll Lock" active={status?.scrollLock ?? false} known={known} />
    </div>
  );
}
