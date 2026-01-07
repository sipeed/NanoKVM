import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { message } from 'antd';

export const Ssh = () => {
  const { t } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    api
      .getSSHState()
      .then((rsp) => {
        if (rsp.data?.enabled) {
          setIsEnabled(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function update() {
    if (isLoading) return;
    setIsLoading(true);

    const rsp = isEnabled ? await api.disableSSH() : await api.enableSSH();
    setIsLoading(false);

    if (rsp.code !== 0) {
      message.error(rsp.msg || t('settings.device.ssh.updateFailed'));
      return;
    }

    setIsEnabled(!isEnabled);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span>SSH</span>

          <Tooltip
            title={t('settings.device.ssh.tip')}
            className="cursor-pointer"
            placement="right"
            styles={{ root: { maxWidth: '400px' } }}
          >
            <CircleAlertIcon className="text-neutral-500" size={14} />
          </Tooltip>
        </div>
        <span className="text-xs text-neutral-500">{t('settings.device.ssh.description')}</span>
      </div>

      <Switch checked={isEnabled} loading={isLoading} onChange={update} />
    </div>
  );
};
