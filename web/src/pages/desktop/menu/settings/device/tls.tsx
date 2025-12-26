import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Tls = () => {
  const { t } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsEnabled(window.location.protocol === 'https:');
  }, []);

  async function update() {
    if (isLoading) return;
    setIsLoading(true);

    const enable = !isEnabled;

    const seconds = enable ? 30 : 10;
    setTimeout(() => {
      reload(enable);
    }, seconds * 1000);

    try {
      const rsp = await api.setTLS(enable);
      if (rsp.code === 0) {
        setIsEnabled(enable);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function reload(enable: boolean) {
    if (!enable) {
      const target = window.location.href.replace(/^https:/, 'http:');
      window.open(target, '_blank');
    }

    window.location.reload();
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span>HTTPS</span>

          <Tooltip
            title={t('settings.device.tls.tip')}
            className="cursor-pointer"
            placement="right"
            styles={{ root: { maxWidth: '400px' } }}
          >
            <CircleAlertIcon className="text-neutral-500" size={14} />
          </Tooltip>
        </div>
        <span className="text-xs text-neutral-500">{t('settings.device.tls.description')}</span>
      </div>

      <Switch checked={isEnabled} loading={isLoading} onChange={update} />
    </div>
  );
};
