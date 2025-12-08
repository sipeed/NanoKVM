import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleHelpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Swap = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    getSwap();
  }, []);

  function getSwap() {
    setIsLoading(true);

    api
      .getSwap()
      .then((rsp) => {
        if (rsp.data?.size > 0) {
          setIsEnabled(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function update(enable: boolean) {
    if (isLoading) return;
    setIsLoading(true);

    const size = enable ? 256 : 0;

    api
      .setSwap(size)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setIsEnabled(enable);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex h-[40px] cursor-pointer items-center justify-between space-x-6 rounded px-2 text-neutral-300 hover:bg-neutral-700/70">
      <div className="flex items-center space-x-1">
        <span>{t('settings.tailscale.swap.title')}</span>
        <Tooltip
          title={t('settings.tailscale.swap.tip')}
          className="cursor-pointer text-neutral-500"
          placement="top"
          overlayStyle={{ maxWidth: '400px' }}
        >
          <CircleHelpIcon size={15} />
        </Tooltip>
      </div>

      <Switch value={isEnabled} loading={isLoading} size="small" onChange={update} />
    </div>
  );
};
