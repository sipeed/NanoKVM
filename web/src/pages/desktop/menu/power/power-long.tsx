import { useState } from 'react';
import { Popconfirm, Slider } from 'antd';
import { CirclePowerIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

type PowerLongProps = {
  showConfirm: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export const PowerLong = ({ showConfirm, isLoading, setIsLoading }: PowerLongProps) => {
  const { t } = useTranslation();

  const [duration, setDuration] = useState(8);

  function power() {
    if (isLoading) return;
    setIsLoading(true);

    api.setGpio('power', duration * 1000).finally(() => {
      setIsLoading(false);
    });
  }

  return (
    <>
      {showConfirm ? (
        <Popconfirm
          placement="bottomLeft"
          title={t('power.powerConfirm')}
          okText={t('power.okBtn')}
          cancelText={t('power.cancelBtn')}
          onConfirm={power}
          color="#404040"
        >
          <div className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70">
            <CirclePowerIcon size={16} />
            <span>{t('power.powerLong')}</span>
            <div className="flex h-full items-start text-xs text-neutral-500">{`${duration}s`}</div>
          </div>
        </Popconfirm>
      ) : (
        <div
          className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
          onClick={power}
        >
          <CirclePowerIcon size={16} />
          <span>{t('power.powerLong')}</span>
          <div className="flex h-full items-start text-xs text-neutral-500">{`${duration}s`}</div>
        </div>
      )}

      <div className="px-3">
        <Slider
          defaultValue={8}
          min={1}
          max={30}
          tooltip={{ placement: 'bottom' }}
          onChange={setDuration}
        />
      </div>
    </>
  );
};
