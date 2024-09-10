import { useEffect, useState } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { Button, Divider, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import { logoutTailscale, updateTailscaleStatus } from '@/api/network.ts';

type DeviceProps = {
  status: string;
  name: string;
  ip: string;
  account: string;
  setStatus: (status: 'notLogin') => void;
};

export const Device = ({ status, name, ip, account, setStatus }: DeviceProps) => {
  const { t } = useTranslation();

  const [isRunning, setIsRunning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    setIsRunning(status === 'running');
  }, []);

  function updateStatus() {
    if (isUpdating) return;
    setIsUpdating(true);

    const command = isRunning ? 'down' : 'up';

    updateTailscaleStatus(command)
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setIsRunning(rsp.data.status === 'running');
      })
      .finally(() => {
        setIsUpdating(false);
      });
  }

  function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    logoutTailscale()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setStatus('notLogin');
      })
      .finally(() => {
        setIsLoggingOut(false);
      });
  }

  return (
    <div className="w-full pt-10">
      <div className="flex justify-between px-3">
        <span>{t('tailscale.enable')}</span>
        <Switch checked={isRunning} loading={isUpdating} onClick={updateStatus} />
      </div>
      <Divider style={{ margin: '20px 0' }} />

      <div className="flex justify-between px-3">
        <span>{t('tailscale.deviceName')}</span>
        <span>{name}</span>
      </div>
      <Divider style={{ margin: '20px 0' }} />

      <div className="flex justify-between px-3">
        <span>{t('tailscale.deviceIP')}</span>
        <span>{ip}</span>
      </div>
      <Divider style={{ margin: '20px 0' }} />

      <div className="flex justify-between px-3">
        <span>{t('tailscale.account')}</span>
        <span>{account}</span>
      </div>
      <Divider style={{ margin: '20px 0' }} />

      <div className="flex justify-center py-5">
        {!showLogoutConfirmation ? (
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<LogoutOutlined />}
            onClick={() => setShowLogoutConfirmation(true)}
          >
            {t('tailscale.logout')}
          </Button>
        ) : (
          <Button
            danger
            type="primary"
            size="large"
            icon={<LogoutOutlined />}
            loading={isLoggingOut}
            onClick={logout}
          >
            {t('tailscale.logout2')}
          </Button>
        )}
      </div>

      {errMsg && <span className="text-red-500">{errMsg}</span>}
    </div>
  );
};
