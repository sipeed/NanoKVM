import { useEffect, useState } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { Button, Divider, Popconfirm, Switch } from 'antd';
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
      <Divider />

      <div className="flex justify-center pt-3">
        <Popconfirm
          placement="bottom"
          title={t('settings.tailscale.logoutDesc')}
          okText={t('settings.tailscale.okBtn')}
          cancelText={t('settings.tailscale.cancelBtn')}
          onConfirm={logout}
        >
          <Button
            danger
            type="primary"
            size="large"
            shape="round"
            icon={<LogoutOutlined />}
            loading={isLogging}
          >
            {t('settings.tailscale.logout')}
          </Button>
        </Popconfirm>
      </div>

      {errMsg && <span className="text-red-500">{errMsg}</span>}
    </div>
  );
};
