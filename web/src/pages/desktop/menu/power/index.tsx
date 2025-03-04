import { useEffect, useState } from 'react';
import { Popover, Slider, Tooltip } from 'antd';
import clsx from 'clsx';
import { CirclePowerIcon, LoaderCircleIcon, PowerIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm';

export const Power = () => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [powerDuration, setPowerDuration] = useState(8);

  const tooltip = t('power.title');
  const [tooltipValue, setTooltipValue] = useState(tooltip);

  useEffect(() => {
    getLed();
    const interval = setInterval(getLed, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  function getLed() {
    api.getGpio().then((rsp: any) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setIsPowerOn(rsp.data.pwr);
    });
  }

  function click(button: 'reset' | 'power', duration?: number) {
    if (isLoading) return;
    setIsLoading(true);

    setIsPopoverOpen(false);

    const millisecond = Math.floor((duration ? duration : powerDuration) * 1000);

    api.setGpio(button, millisecond).finally(() => {
      setIsLoading(false);
    });
  }

  function onChange(value: number) {
    setPowerDuration(value);
  }

  const content = (
    <div className="flex flex-col space-y-1">
      <div
        className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
        onClick={() => click('reset', 0.8)}
      >
        <RotateCcwIcon size={16} />
        <span>{t('power.reset')}</span>
      </div>

      <div
        className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
        onClick={() => click('power', 0.8)}
      >
        <PowerIcon size={16} />
        <span>{t('power.powerShort')}</span>
      </div>

      <div
        className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
        onClick={() => click('power')}
      >
        <CirclePowerIcon size={16} />
        <span>{t('power.powerLong')}</span>
        <div className="flex h-full items-start text-xs text-neutral-500">{`${powerDuration}s`}</div>
      </div>
      <div className="px-3">
        <Slider
          defaultValue={8}
          min={1}
          max={30}
          tooltip={{ placement: 'bottom' }}
          onChange={onChange}
        />
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      placement="bottomLeft"
      trigger="click"
      arrow={false}
      open={isPopoverOpen}
      onOpenChange={(visible) => {
        setIsPopoverOpen(visible);
        setTooltipValue(visible ? '' : tooltip);
      }}
    >
      <Tooltip title={tooltipValue} placement="bottom">
        <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded hover:bg-neutral-700 hover:text-white">
          <div
            className={clsx('h-[18px] w-[18px]', isPowerOn ? 'text-green-600' : 'text-neutral-500')}
          >
            {isLoading ? (
              <LoaderCircleIcon className="animate-spin" size={18} />
            ) : (
              <PowerIcon size={18} />
            )}
          </div>
        </div>
      </Tooltip>
    </Popover>
  );
};
