import { useState } from 'react';
import { Popconfirm, Tooltip } from 'antd';
import { RefreshCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Reboot = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  function reboot() {
    if (isLoading) return;
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      window.location.reload();
    }, 30000);

    api
      .reboot()
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
        clearTimeout(timeoutId);
      });
  }

  return (
    <Popconfirm
      placement="bottom"
      title={t('settings.device.rebootDesc')}
      okText={t('settings.device.okBtn')}
      cancelText={t('settings.device.cancelBtn')}
      onConfirm={reboot}
    >
      <Tooltip title={t('settings.device.reboot')} placement="bottom" mouseEnterDelay={0.6}>
        <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-red-500 hover:bg-neutral-700/80 hover:text-red-400">
          <RefreshCwIcon size={18} className={isLoading ? 'animate-spin' : ''} />
        </div>
      </Tooltip>
    </Popconfirm>
  );
};
