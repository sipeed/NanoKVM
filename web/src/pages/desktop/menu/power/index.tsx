import { useEffect, useState } from 'react';
import { Popconfirm, Slider } from 'antd';
import clsx from 'clsx';
import { CirclePowerIcon, LoaderCircleIcon, PowerIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPowerConfirm } from '../../../../lib/localstorage'

import * as api from '@/api/vm';
import { MenuItem } from '@/components/menu-item.tsx';

export const Power = () => {
  const { t } = useTranslation();
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [powerDuration, setPowerDuration] = useState(8);


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

  function click(button: 'reset' | 'power',type: string, duration?: number) {

    if(getPowerConfirm() == 'true' && type == 'first') return;

    if (isLoading) return;
    setIsLoading(true);

    const millisecond = Math.floor((duration ? duration : powerDuration) * 1000);

    api.setGpio(button, millisecond).finally(() => {
      setIsLoading(false);
    });
  }

  function onChange(value: number) {
    setPowerDuration(value);
  }


  
  const icon = (
    <div className={clsx('h-[18px] w-[18px]', isPowerOn ? 'text-green-600' : 'text-neutral-500')}>
      {isLoading ? (
        <LoaderCircleIcon className="animate-spin" size={18} />
      ) : (
        <PowerIcon size={18} />
      )}
    </div>
  );

  const content = (
    <div className="flex flex-col space-y-1">

      <Popconfirm
        placement="bottom"
        title={t('power.reset')}
        description={t('power.powerConfirm')}
        okText={t('settings.device.okBtn')}
        cancelText={t('settings.device.cancelBtn')}
        onConfirm={() => click('reset', 'twice', 0.8)}
        disabled={!(getPowerConfirm() == 'true')}
      >
      <div
        className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
        onClick={() => click('reset', 'first', 0.8)}
      >
        <RotateCcwIcon size={16} />
        <span>{t('power.reset')}</span>
      </div>
      </Popconfirm>

      <Popconfirm
        placement="bottom"
        title={t('power.powerShort')}
        description={t('power.powerConfirm')}
        okText={t('settings.device.okBtn')}
        cancelText={t('settings.device.cancelBtn')}
        onConfirm={() => click('power', 'twice', 0.8)}
        disabled={!(getPowerConfirm() == 'true')}
      >
      <div
        className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
          onClick={() => click('power', 'first', 0.8)}
      >
        <PowerIcon size={16} />
        <span>{t('power.powerShort')}</span>
      </div>
      </Popconfirm>


      <Popconfirm
        placement="bottom"
        title={t('power.powerLong')}
        description={t('power.powerConfirm')}
        okText={t('settings.device.okBtn')}
        cancelText={t('settings.device.cancelBtn')}
        onConfirm={() => click('power', 'twice')}
        disabled={!(getPowerConfirm() == 'true')}
      >
      <div
        className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
          onClick={() => click('power', 'first')}
      >
        <CirclePowerIcon size={16} />
        <span>{t('power.powerLong')}</span>
        <div className="flex h-full items-start text-xs text-neutral-500">{`${powerDuration}s`}</div>
      </div>
      </Popconfirm>

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

  return <MenuItem title={t('power.title')} icon={icon} content={content} />;
};
