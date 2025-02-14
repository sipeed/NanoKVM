import { useEffect, useState } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { Button, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/tailscale.ts';

import { Status } from './types.ts';

type DeviceProps = {
  status: Status;
  onLogout: () => void;
};

export const Device = ({ status, onLogout }: DeviceProps) => {
  const { t } = useTranslation();

  const [isRunning, setIsRunning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    setIsRunning(status.state === 'running');
  }, [status]);

  async function update() {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const rsp = isRunning ? await api.down() : await api.up();
      if (rsp.code !== 0) {
        setErrMsg(rsp.msg);
        return;
      }

      setIsRunning(!isRunning);
    } finally {
      setIsUpdating(false);
    }
  }

  async function logout() {
    if (isLogging) return;
    setIsLogging(true);

    api
      .logout()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        onLogout();
      })
      .finally(() => {
        setIsLogging(false);
      });
  }

  return (
    <div className="flex flex-col space-y-6 pt-5">
      <div className="flex justify-between">
        <span>{t('settings.tailscale.enable')}</span>
        <Switch checked={isRunning} loading={isUpdating} onClick={update} />
      </div>

      <div className="flex justify-between">
        <span>{t('settings.tailscale.deviceName')}</span>
        <span>{status.name}</span>
      </div>

      <div className="flex justify-between">
        <span>{t('settings.tailscale.deviceIP')}</span>
        <span>{status.ip}</span>
      </div>

      <div className="flex justify-between">
        <span>{t('settings.tailscale.account')}</span>
        <span>{status.account}</span>
      </div>

      <div className="flex justify-center pt-10">
        {!isConfirmation ? (
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<LogoutOutlined />}
            onClick={() => setIsConfirmation(true)}
          >
            {t('settings.tailscale.logout')}
          </Button>
        ) : (
          <Button
            danger
            type="primary"
            size="large"
            icon={<LogoutOutlined />}
            loading={isLogging}
            onClick={logout}
          >
            {t('settings.tailscale.logout2')}
          </Button>
        )}
      </div>

      {errMsg && <span className="text-red-500">{errMsg}</span>}
    </div>
  );
};
