import { useEffect, useState } from 'react';
import { Divider } from 'antd';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { Connect } from './connect.tsx';
import { Device } from './device.tsx';
import { ErrorHelp } from './error-help.tsx';
import { Header } from './header.tsx';
import { Install } from './install.tsx';
import { Run } from './run.tsx';
import type { Status } from './types.ts';

type NetbirdProps = {
  setIsLocked: (isLocked: boolean) => void;
};

export const Netbird = ({ setIsLocked }: NetbirdProps) => {
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
      .getStatus()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setErrMsg('');
        setStatus(rsp.data);
      })
      .catch((err) => {
        setErrMsg(err.message || 'Failed to get status');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <>
      <Header state={status?.state} onSuccess={getStatus} />
      <Divider className="opacity-50" />

      {isLoading ? (
        <div className="flex w-full items-center justify-center space-x-2 pt-5 text-neutral-500">
          <LoaderCircleIcon className="animate-spin" size={18} />
          <span>{t('settings.netbird.loading')}</span>
        </div>
      ) : (
        <>
          {status?.state === 'notInstall' && (
            <Install setIsLocked={setIsLocked} onSuccess={getStatus} />
          )}

          {status?.state === 'notRunning' && <Run onSuccess={getStatus} />}

          {status?.state === 'notLogin' && <Connect onSuccess={getStatus} />}

          {(status?.state === 'stopped' || status?.state === 'running') && (
            <Device status={status} onRefresh={getStatus} />
          )}

          {errMsg && <ErrorHelp error={errMsg} onRefresh={getStatus} />}
        </>
      )}
    </>
  );
};
