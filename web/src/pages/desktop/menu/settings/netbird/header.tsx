import { useEffect, useState } from 'react';
import { Popconfirm, Switch } from 'antd';
import { CircleStopIcon, LoaderIcon, RotateCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';
import * as vpnApi from '@/api/extensions/vpn.ts';

import type { State } from './types.ts';

type HeaderProps = {
  state: State | undefined;
  onSuccess: () => void;
};

type Loading = '' | 'restarting' | 'stopping';

export const Header = ({ state, onSuccess }: HeaderProps) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState<Loading>('');
  const [isAutostart, setIsAutostart] = useState(false);
  const [autostartLoading, setAutostartLoading] = useState(false);

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
    if (loading !== '') return;
    setLoading('restarting');

    api.restart().finally(() => {
      setLoading('');
      onSuccess();
    });
  }

  function stop() {
    if (loading !== '') return;
    setLoading('stopping');

    api.stop().finally(() => {
      setLoading('');
      onSuccess();
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-base">{t('settings.netbird.title')}</span>

        {state && state !== 'notInstall' && (
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

      <div className="flex items-center space-x-2">
        {state && ['notRunning', 'notLogin', 'stopped', 'running'].includes(state) && (
          <>
            {/* restart button */}
            <Popconfirm
              title={t('settings.netbird.restart')}
              onConfirm={restart}
              okText={t('settings.netbird.okBtn')}
              cancelText={t('settings.netbird.cancelBtn')}
              placement="bottom"
              disabled={loading !== ''}
            >
              <div className="flex cursor-pointer rounded p-1 text-green-500 hover:bg-neutral-600 hover:text-green-500/80">
                {loading === 'restarting' ? (
                  <LoaderIcon className="animate-spin" size={18} />
                ) : (
                  <RotateCwIcon size={18} />
                )}
              </div>
            </Popconfirm>

            {/* stop button */}
            <Popconfirm
              title={t('settings.netbird.stop')}
              description={t('settings.netbird.stopDesc')}
              onConfirm={stop}
              okText={t('settings.netbird.okBtn')}
              cancelText={t('settings.netbird.cancelBtn')}
              placement="bottom"
              disabled={loading !== ''}
            >
              <div className="flex cursor-pointer rounded p-1 text-red-500 hover:bg-neutral-600 hover:text-red-500/80">
                {loading === 'stopping' ? (
                  <LoaderIcon className="animate-spin" size={18} />
                ) : (
                  <CircleStopIcon size={18} />
                )}
              </div>
            </Popconfirm>
          </>
        )}
      </div>
    </div>
  );
};
