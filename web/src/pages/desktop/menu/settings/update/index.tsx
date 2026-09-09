import { useEffect, useRef, useState } from 'react';
import { LoadingOutlined, RocketOutlined, SmileOutlined } from '@ant-design/icons';
import { Button, Divider, Result, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import semver from 'semver';

import * as api from '@/api/application.ts';

import { CustomServer } from './custom-server.tsx';
import { Offline } from './offline.tsx';
import { Preview } from './preview.tsx';

type UpdateProps = {
  setIsLocked: (isClosable: boolean) => void;
};

const RESTART_COUNTDOWN_SECONDS = 50;

export const Update = ({ setIsLocked }: UpdateProps) => {
  const { t } = useTranslation();

  const [status, setStatus] = useState('');
  const [restartSeconds, setRestartSeconds] = useState(RESTART_COUNTDOWN_SECONDS);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [isCustomServerEnabled, setIsCustomServerEnabled] = useState(false);
  const [isCustomServerPending, setIsCustomServerPending] = useState(false);
  const versionRequestRef = useRef(0);
  const restartTimerRef = useRef<number | null>(null);

  useEffect(() => {
    checkForUpdates();
    return () => {
      if (restartTimerRef.current !== null) {
        window.clearInterval(restartTimerRef.current);
      }
    };
  }, []);

  function checkForUpdates() {
    const requestId = ++versionRequestRef.current;
    setStatus('loading');

    api
      .getVersion()
      .then((rsp: any) => {
        if (requestId !== versionRequestRef.current) return;
        if (rsp.code !== 0 || !rsp.data) {
          setStatus('failed');
          setErrMsg(t('settings.update.queryFailed'));
          return;
        }

        setCurrentVersion(rsp.data.current);

        if (rsp.data?.latest) {
          setLatestVersion(rsp.data.latest);
          const isLatest = semver.gte(rsp.data.current, rsp.data.latest);
          setStatus(isLatest ? 'latest' : 'outdated');
        } else {
          setStatus('latest');
        }
      })
      .catch(() => {
        if (requestId !== versionRequestRef.current) return;
        setStatus('failed');
        setErrMsg(t('settings.update.queryFailed'));
      });
  }

  function startRestartCountdown() {
    if (restartTimerRef.current !== null) {
      window.clearInterval(restartTimerRef.current);
    }

    let secondsRemaining = RESTART_COUNTDOWN_SECONDS;
    setRestartSeconds(secondsRemaining);
    setStatus('restarting');

    restartTimerRef.current = window.setInterval(() => {
      secondsRemaining -= 1;
      setRestartSeconds(secondsRemaining);

      if (secondsRemaining <= 0) {
        if (restartTimerRef.current !== null) {
          window.clearInterval(restartTimerRef.current);
          restartTimerRef.current = null;
        }
        window.location.reload();
      }
    }, 1000);
  }

  function update() {
    if (status !== 'outdated' || isCustomServerPending) return;

    setIsLocked(true);
    setStatus('updating');

    api
      .update()
      .then((rsp: any) => {
        if (rsp.code !== 0) {
          throw new Error(t('settings.update.updateFailed'));
        }
        startRestartCountdown();
      })
      .catch((error: unknown) => {
        // Some firmware revisions restart the update service before the HTTP
        // response reaches the browser. Treat that network disconnect as the
        // expected reboot path, while keeping explicit server errors visible.
        if (error instanceof TypeError) {
          startRestartCountdown();
          return;
        }
        setIsLocked(false);
        setStatus('failed');
        setErrMsg(error instanceof Error ? error.message : t('settings.update.updateFailed'));
      });
  }

  if (status === 'restarting') {
    return (
      <div className="flex min-h-[460px] flex-col items-center justify-center gap-5 px-6 text-center">
        <Spin size="large" />
        <div className="text-xl font-medium text-neutral-800">更新完成，正在重新啟動中</div>
        <div className="text-4xl font-semibold text-blue-600">{restartSeconds}</div>
        <div className="text-sm text-neutral-500">秒後將自動重新整理網頁（本次等待 50 秒）</div>
      </div>
    );
  }

  return (
    <>
      <div className="text-base">{t('settings.update.title')}</div>
      <Divider className="opacity-50" />

      <Preview
        checkForUpdates={checkForUpdates}
        disabled={isCustomServerEnabled || isCustomServerPending}
      />
      <CustomServer
        checkForUpdates={checkForUpdates}
        onEnabledChange={setIsCustomServerEnabled}
        onPendingChange={setIsCustomServerPending}
      />
      <Offline
        status={status}
        setStatus={setStatus}
        setIsLocked={setIsLocked}
        setErrMsg={setErrMsg}
        onRestarting={startRestartCountdown}
      />
      <Divider className="opacity-50" />

      <div className="flex min-h-[320px] flex-col justify-between">
        {status === 'loading' && (
          <div className="flex justify-center pt-24">
            <Spin indicator={<LoadingOutlined spin />} size="large" />
          </div>
        )}

        {status === 'updating' && (
          <div className="flex flex-col items-center justify-center space-y-10 pb-10 pt-24">
            <Spin size="large" />
            <span className="text-neutral-500">{t('settings.update.updating')}</span>
          </div>
        )}

        {status === 'latest' && (
          <Result
            status="success"
            icon={<SmileOutlined />}
            title={currentVersion}
            subTitle={t('settings.update.isLatest')}
            extra={[
              <Button key="confirm" onClick={checkForUpdates}>
                {t('settings.update.title')}
              </Button>
            ]}
          />
        )}

        {status === 'outdated' && (
          <Result
            status="warning"
            icon={<RocketOutlined />}
            title={`${currentVersion} -> ${latestVersion}`}
            subTitle={t('settings.update.available')}
            extra={[
              <Button
                key="confirm"
                type="primary"
                disabled={isCustomServerPending}
                onClick={update}
              >
                {t('settings.update.confirm')}
              </Button>
            ]}
          />
        )}

        {status === 'failed' && <Result subTitle={errMsg} />}

        <div className="flex justify-center">
          <Button
            type="link"
            size="small"
            href="https://github.com/sipeed/NanoKVM/blob/main/CHANGELOG.md"
            target="_blank"
          >
            CHANGELOG
          </Button>
        </div>
      </div>
    </>
  );
};
