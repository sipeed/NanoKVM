import { Tooltip } from 'antd';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { useKeyboardLedStatus } from './use-keyboard-led-status';

type LockIndicatorProps = {
  labelKey: 'numLock' | 'capsLock' | 'scrollLock';
  active: boolean;
  known: boolean;
};

function LockIndicator({ labelKey, active, known }: LockIndicatorProps) {
  const { t } = useTranslation();
  const label = t(`settings.keyboardLedStatus.${labelKey}`);
  const state = known
    ? active
      ? t('settings.keyboardLedStatus.on')
      : t('settings.keyboardLedStatus.off')
    : t('settings.keyboardLedStatus.unknown');

  return (
    <Tooltip
      title={t('settings.keyboardLedStatus.indicatorLabel', { label, state })}
      placement="bottom"
      mouseEnterDelay={0.6}
    >
      <div
        className="flex h-[8px] items-center gap-1 px-1 text-[8px] font-medium leading-[8px] text-neutral-400"
        aria-label={t('settings.keyboardLedStatus.indicatorLabel', { label, state })}
        role="img"
      >
        <span
          aria-hidden="true"
          className={clsx(
            'flex h-2.5 w-2.5 items-center justify-center rounded-full text-[7px] leading-none',
            known
              ? active
                ? 'bg-emerald-400'
                : 'bg-neutral-600'
              : 'border border-dashed border-neutral-500 text-neutral-300'
          )}
        >
          {!known && '?'}
        </span>
        <span className="hidden sm:inline">{t(`settings.keyboardLedStatus.${labelKey}Short`)}</span>
      </div>
    </Tooltip>
  );
}

export function KeyboardLedStatus() {
  const { t } = useTranslation();
  const status = useKeyboardLedStatus();
  const known = status?.known ?? false;

  return (
    <div
      className="flex h-full w-[40px] flex-col items-start justify-center rounded bg-neutral-800/80"
      aria-label={t('settings.keyboardLedStatus.groupLabel')}
      role="group"
    >
      <LockIndicator labelKey="numLock" active={status?.numLock ?? false} known={known} />
      <LockIndicator labelKey="capsLock" active={status?.capsLock ?? false} known={known} />
      <LockIndicator labelKey="scrollLock" active={status?.scrollLock ?? false} known={known} />
    </div>
  );
}
