import { useEffect, useState } from 'react';
import { Divider } from 'antd';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';

import { Device } from './device.tsx';
import { Install } from './install.tsx';
import { Login } from './login.tsx';

type State = 'notInstall' | 'notLogin' | 'stopped' | 'running';

type Status = {
  state: State;
  name: string;
  ip: string;
  account: string;
};

type TailscaleProps = {
  setIsLocked: (isLocked: boolean) => void;
};

export const Tailscale = ({ setIsLocked }: TailscaleProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>();
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    getStatus();
  }, []);

  function getStatus() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .getTailscaleStatus()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setStatus(rsp.data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <>
      <div className="text-base font-bold">{t('settings.tailscale.title')}</div>
      <Divider />

      {isLoading ? (
        <div className="flex items-center justify-center space-x-2 pt-5 text-neutral-500">
          <LoaderCircleIcon className="animate-spin" size={18} />
          <span>{t('settings.tailscale.loading')}</span>
        </div>
      ) : (
        <>
          {status?.state === 'notInstall' && (
            <Install setIsLocked={setIsLocked} onSuccess={getStatus} />
          )}

          {status?.state === 'notLogin' && <Login onSuccess={getStatus} />}

          {(status?.state === 'stopped' || status?.state === 'running') && (
            <Device status={status} onLogout={getStatus} />
          )}

          {errMsg && <div className="pt-5 text-red-500">{errMsg}</div>}
        </>
      )}
    </>
  );
};
