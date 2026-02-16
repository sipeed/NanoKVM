import { useEffect, useState } from 'react';
import { Popconfirm, Popover, Switch } from 'antd';
import { CircleStopIcon, EllipsisIcon, LoaderIcon, RotateCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/tailscale.ts';
import * as vpnApi from '@/api/extensions/vpn.ts';

import { Memory } from './memory.tsx';
import { Swap } from './swap.tsx';
import type { State } from './types.ts';
import { Uninstall } from './uninstall.tsx';

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
        setIsAutostart(rsp.data.vpn === 'tailscale');
      }
    });
  }, []);

  function handleAutostartChange(checked: boolean) {
    if (!checked || autostartLoading) return;
    setAutostartLoading(true);

    vpnApi
      .setPreference('tailscale')
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
        <span className="text-base">{t('settings.tailscale.title')}</span>

        {state && state !== 'notInstall' && (
          <Popconfirm
            title={t('settings.tailscale.autostartConfirm')}
            onConfirm={() => handleAutostartChange(true)}
            okText={t('settings.tailscale.okBtn')}
            cancelText={t('settings.tailscale.cancelBtn')}
            placement="bottom"
            disabled={isAutostart}
          >
            <Switch
              checked={isAutostart}
              loading={autostartLoading}
              size="small"
              title={t('settings.tailscale.autostart')}
            />
          </Popconfirm>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {state && ['notRunning', 'notLogin', 'stopped', 'running'].includes(state) && (
          <>
            {/* restart button */}
            <Popconfirm
              title={t('settings.tailscale.restart')}
              onConfirm={restart}
              okText={t('settings.tailscale.okBtn')}
              cancelText={t('settings.tailscale.cancelBtn')}
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
              title={t('settings.tailscale.stop')}
              description={t('settings.tailscale.stopDesc')}
              onConfirm={stop}
              okText={t('settings.tailscale.okBtn')}
              cancelText={t('settings.tailscale.cancelBtn')}
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

        {/* more button */}
        {state && state !== 'notInstall' && (
          <Popover
            content={
              <div className="flex min-w-[250px] flex-col">
                <Memory />
                <Swap />
                <Uninstall onSuccess={onSuccess} />
              </div>
            }
            placement="bottom"
            trigger="click"
          >
            <div className="flex cursor-pointer rounded p-1 text-white hover:bg-neutral-700/50">
              <EllipsisIcon size={18} />
            </div>
          </Popover>
        )}
      </div>
    </div>
  );
};
