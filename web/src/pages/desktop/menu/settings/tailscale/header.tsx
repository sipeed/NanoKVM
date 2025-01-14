import { useEffect, useState } from 'react';
import { Popconfirm } from 'antd';
import { CircleStopIcon, LoaderIcon, RotateCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';

import { Status } from './types.ts';

type HeaderProps = {
  status: Status | undefined;
  onSuccess: () => void;
};

export const Header = ({ status, onSuccess }: HeaderProps) => {
  const { t } = useTranslation();

  const [isRunning, setIsRunning] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    const running =
      status !== undefined && ['notLogin', 'stopped', 'running'].includes(status.state);
    setIsRunning(running);
  }, [status]);

  function restart() {
    if (isRestarting || isStopping) return;
    setIsRestarting(true);

    api.restartTailscale().finally(() => {
      setIsRestarting(false);
      onSuccess();
    });
  }

  function stop() {
    if (isRestarting || isStopping) return;
    setIsStopping(true);

    api.stopTailscale().finally(() => {
      setIsStopping(false);
      onSuccess();
    });
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-base font-bold">{t('settings.tailscale.title')}</span>
      {isRunning && (
        <div className="flex items-center space-x-3">
          <Popconfirm
            title={t('settings.tailscale.restart')}
            onConfirm={restart}
            okText={t('settings.tailscale.okBtn')}
            cancelText={t('settings.tailscale.cancelBtn')}
            placement="bottom"
            disabled={isRestarting || isStopping}
          >
            <div className="cursor-pointer text-green-500 hover:text-green-500/80">
              {isRestarting ? (
                <LoaderIcon className="animate-spin" size={20} />
              ) : (
                <RotateCwIcon size={20} />
              )}
            </div>
          </Popconfirm>

          <Popconfirm
            title={t('settings.tailscale.stop')}
            description={t('settings.tailscale.stopDesc')}
            onConfirm={stop}
            okText={t('settings.tailscale.okBtn')}
            cancelText={t('settings.tailscale.cancelBtn')}
            placement="bottom"
            disabled={isRestarting || isStopping}
          >
            <div className="cursor-pointer text-red-500 hover:text-red-500/80">
              {isStopping ? (
                <LoaderIcon className="animate-spin" size={20} />
              ) : (
                <CircleStopIcon size={20} />
              )}
            </div>
          </Popconfirm>
        </div>
      )}
    </div>
  );
};
