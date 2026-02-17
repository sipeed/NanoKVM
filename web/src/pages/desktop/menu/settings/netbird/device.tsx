import { useEffect, useState } from 'react';
import { DisconnectOutlined } from '@ant-design/icons';
import { Button, Divider, Popconfirm, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';

import { Status } from './types.ts';

type DeviceProps = {
  status: Status;
  onLogout: () => void;
};

export const Device = ({ status, onLogout }: DeviceProps) => {
  const { t } = useTranslation();

  const [isRunning, setIsRunning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    setIsRunning(status.state === 'running');
  }, [status]);

  async function update() {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const rsp = isRunning ? await api.down() : await api.login();
      if (rsp.code !== 0) {
        setErrMsg(rsp.msg);
        return;
      }

      setIsRunning(!isRunning);
    } finally {
      setIsUpdating(false);
    }
  }

  async function disconnect() {
    if (isDisconnecting) return;
    setIsDisconnecting(true);

    api
      .down()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        onLogout();
      })
      .finally(() => {
        setIsDisconnecting(false);
      });
  }

  return (
    <div className="flex flex-col space-y-6 pt-5">
      <div className="flex justify-between">
        <span>{t('settings.netbird.enable')}</span>
        <Switch checked={isRunning} loading={isUpdating} onClick={update} />
      </div>

      <div className="flex justify-between">
        <span>{t('settings.netbird.deviceName')}</span>
        <span>{status.name}</span>
      </div>

      <div className="flex justify-between">
        <span>{t('settings.netbird.deviceIP')}</span>
        <span>{status.ip}</span>
      </div>

      <div className="flex justify-between">
        <span>{t('settings.netbird.version')}</span>
        <span>{status.version}</span>
      </div>
      <Divider />

      <div className="flex justify-center pt-3">
        <Popconfirm
          placement="bottom"
          title={t('settings.netbird.disconnectConfirm')}
          okText={t('settings.netbird.okBtn')}
          cancelText={t('settings.netbird.cancelBtn')}
          onConfirm={disconnect}
        >
          <Button
            danger
            type="primary"
            size="large"
            shape="round"
            icon={<DisconnectOutlined />}
            loading={isDisconnecting}
          >
            {t('settings.netbird.disconnect')}
          </Button>
        </Popconfirm>
      </div>

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onLogout} />}
    </div>
  );
};
