import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Divider } from 'antd';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { Device } from './device.tsx';
import { ErrorHelp } from './error-help.tsx';
import { Header } from './header.tsx';
import { Install } from './install.tsx';
import { Login } from './login.tsx';
import { Run } from './run.tsx';
import type { Status } from './types.ts';
import { Update } from './update.tsx';

type NetbirdProps = {
  setIsLocked: (isLocked: boolean) => void;
};

export const Netbird = ({ setIsLocked }: NetbirdProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>();
  const [errMsg, setErrMsg] = useState('');
  const [hasFreshStatus, setHasFreshStatus] = useState(false);
  const requestId = useRef(0);
  const isMounted = useRef(true);

  const getStatus = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    try {
      const rsp = await api.getStatus();
      if (!isMounted.current || currentRequestId !== requestId.current) return;

      if (rsp.code !== 0) {
        setErrMsg(rsp.msg);
        setHasFreshStatus(false);
        return;
      }

      setErrMsg('');
      setStatus(rsp.data);
      setHasFreshStatus(true);
    } catch (err: any) {
      if (!isMounted.current || currentRequestId !== requestId.current) return;
      setErrMsg(err?.message || 'Failed to get status');
      setHasFreshStatus(false);
    } finally {
      if (isMounted.current && currentRequestId === requestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Effects are mounted twice in development Strict Mode. Restore the guard
    // here rather than allowing the first cleanup to suppress the real request.
    isMounted.current = true;
    void getStatus();

    return () => {
      isMounted.current = false;
      requestId.current += 1;
    };
  }, [getStatus]);

  return (
    <>
      <Header state={status?.state} statusIsFresh={hasFreshStatus} onSuccess={getStatus} />
      <Divider className="opacity-50" />

      {isLoading && !status ? (
        <div className="flex w-full items-center justify-center space-x-2 pt-5 text-neutral-500">
          <LoaderCircleIcon className="animate-spin" size={18} />
          <span>{t('settings.netbird.loading')}</span>
        </div>
      ) : (
        <>
          {errMsg && (
            <>
              <Alert
                className="mb-4"
                type="warning"
                showIcon
                message={t(
                  status ? 'settings.netbird.statusStale' : 'settings.netbird.statusUnknown'
                )}
                description={errMsg}
              />
              <ErrorHelp
                error={errMsg}
                onRefresh={getStatus}
                canRestart={!!status && status.state !== 'notInstall'}
              />
            </>
          )}

          {isLoading && status && (
            <div className="mb-4 flex items-center space-x-2 text-sm text-neutral-500">
              <LoaderCircleIcon className="animate-spin" size={16} />
              <span>{t('settings.netbird.loading')}</span>
            </div>
          )}

          {/*
            A client older than the firmware's pin keeps running, so this is an
            offer, not a warning. Updating replaces the binary, which means
            stopping the daemon: the panel says so before the button is used,
            because on a NetBird-only device that is the connection carrying
            the request.
          */}
          {status?.updateAvailable && <Update status={status} onSuccess={getStatus} />}

          {status?.state === 'notInstall' && (
            <Install setIsLocked={setIsLocked} onSuccess={getStatus} />
          )}

          {status?.state === 'notRunning' && <Run onSuccess={getStatus} />}

          {status?.state === 'notLogin' && <Login onSuccess={getStatus} />}

          {/*
            `stopped` covers two situations the CLI status does not separate:
            bound but disconnected, and never bound at all. Rendering the device
            panel for the second leaves empty Name/IP and no way forward, so an
            unnamed device is routed to Login instead.
          */}
          {status?.state === 'stopped' && !status.name && <Login onSuccess={getStatus} />}

          {((status?.state === 'stopped' && !!status.name) || status?.state === 'running') && (
            <Device status={status} onLogout={getStatus} />
          )}
        </>
      )}
    </>
  );
};
