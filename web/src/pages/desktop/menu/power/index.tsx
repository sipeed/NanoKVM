import { useEffect, useState } from 'react';
import { Divider, Switch, Tooltip } from 'antd';
import clsx from 'clsx';
import { LoaderCircleIcon, PowerIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm';
import * as localstorage from '@/lib/localstorage.ts';
import { MenuItem } from '@/components/menu-item.tsx';

import { PowerLong } from './power-long.tsx';
import { PowerShort } from './power-short.tsx';
import { Reset } from './reset.tsx';

export const Power = () => {
  const { t } = useTranslation();

  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getLed();
    const interval = setInterval(getLed, 5000);

    const powerConfirm = localstorage.getPowerConfirm();
    setShowConfirm(powerConfirm);

    return () => {
      clearInterval(interval);
    };
  }, []);

  async function getLed() {
    try {
      const rsp = await api.getGpio();
      if (rsp.code === 0) {
        setIsPowerOn(rsp.data.pwr);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function updateShowConfirm(value: boolean) {
    setShowConfirm(value);
    localstorage.setPowerConfirm(value);
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
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-base font-bold text-neutral-300">{t('power.title')}</span>

        <div className="flex items-center space-x-2">
          <Tooltip title={t('power.showConfirmTip')} placement="right">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-400">{t('power.showConfirm')}</span>

              <Switch size="small" checked={showConfirm} onChange={updateShowConfirm} />
            </div>
          </Tooltip>
        </div>
      </div>

      <Divider style={{ margin: '10px 0 15px 0' }} />

      <div className="flex flex-col space-y-1">
        <Reset showConfirm={showConfirm} isLoading={isLoading} setIsLoading={setIsLoading} />
        <PowerShort showConfirm={showConfirm} isLoading={isLoading} setIsLoading={setIsLoading} />
        <PowerLong showConfirm={showConfirm} isLoading={isLoading} setIsLoading={setIsLoading} />
      </div>
    </div>
  );

  return <MenuItem title={t('power.title')} icon={icon} content={content} />;
};
