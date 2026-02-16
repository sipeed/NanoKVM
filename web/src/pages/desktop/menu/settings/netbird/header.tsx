import { useEffect, useState } from 'react';
import { Button, Popconfirm, Space, Switch } from 'antd';
import { CircleStopIcon, RotateCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';
import * as vpnApi from '@/api/extensions/vpn.ts';

import type { State } from './types.ts';

type HeaderProps = {
  state: State | undefined;
  onSuccess: () => void;
};

export const Header = ({ state, onSuccess }: HeaderProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isAutostart, setIsAutostart] = useState(false);
  const [autostartLoading, setAutostartLoading] = useState(false);

  const canOperate = state !== 'notInstall';

  useEffect(() => {
    vpnApi.getPreference().then((rsp: any) => {
      if (rsp.data?.vpn) {
        setIsAutostart(rsp.data.vpn === 'netbird');
      }
    });
  }, []);

  function handleAutostartChange(checked: boolean) {
    if (!checked || autostartLoading) return;
    setAutostartLoading(true);

    vpnApi
      .setPreference('netbird')
      .then(() => {
        setIsAutostart(true);
        onSuccess();
      })
      .finally(() => {
        setAutostartLoading(false);
      });
  }

  function restart() {
    if (isLoading) return;
    setIsLoading(true);
    api.restart().finally(() => {
      setIsLoading(false);
      onSuccess();
    });
  }

  function stop() {
    if (isLoading) return;
    setIsLoading(true);
    api.stop().finally(() => {
      setIsLoading(false);
      onSuccess();
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-base">{t('settings.netbird.title')}</span>

        {canOperate && (
          <Popconfirm
            title={t('settings.netbird.autostartConfirm')}
            onConfirm={() => handleAutostartChange(true)}
            okText={t('settings.netbird.okBtn')}
            cancelText={t('settings.netbird.cancelBtn')}
            placement="bottom"
            disabled={isAutostart}
          >
            <Switch
              checked={isAutostart}
              loading={autostartLoading}
              size="small"
              title={t('settings.netbird.autostart')}
            />
          </Popconfirm>
        )}
      </div>

      {canOperate && (
        <Space>
          <Popconfirm
            title={t('settings.netbird.restartConfirm')}
            okText={t('settings.netbird.okBtn')}
            cancelText={t('settings.netbird.cancelBtn')}
            onConfirm={restart}
          >
            <Button loading={isLoading} icon={<RotateCwIcon size={14} />}>
              {t('settings.netbird.restart')}
            </Button>
          </Popconfirm>

          <Popconfirm
            title={t('settings.netbird.stopConfirm')}
            okText={t('settings.netbird.okBtn')}
            cancelText={t('settings.netbird.cancelBtn')}
            onConfirm={stop}
          >
            <Button danger loading={isLoading} icon={<CircleStopIcon size={14} />}>
              {t('settings.netbird.stop')}
            </Button>
          </Popconfirm>
        </Space>
      )}
    </div>
  );
};
