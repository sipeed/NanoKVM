import { useCallback, useEffect, useRef, useState } from 'react';
import { Popconfirm, Popover, Switch } from 'antd';
import { CircleStopIcon, EllipsisIcon, LoaderIcon, RotateCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';
import * as vpnApi from '@/api/extensions/vpn.ts';

import { ErrorHelp } from './error-help.tsx';
import type { State } from './types.ts';
import { Uninstall } from './uninstall.tsx';

type HeaderProps = {
  state: State | undefined;
  statusIsFresh: boolean;
  onSuccess: () => void;
};

type Loading = '' | 'restarting' | 'stopping';

// A transport timeout does not tell us whether the server applied the
// mutation. Keep observing until an authoritative outcome is established;
// until then the switch stays unavailable, so a second POST cannot race the
// first one or overwrite an unknown result.
const PREFERENCE_RECHECK_INTERVAL = 2 * 1000;
const PREFERENCE_MAX_RECHECK_INTERVAL = 30 * 1000;
// A successful GET that still names the previous VPN is only conclusive after
// the timed-out server handler has had enough time to finish. Failed or
// malformed reads never become a negative result merely because time passed.
const PREFERENCE_CONFIRMATION_WINDOW = 2 * 60 * 1000;

export const Header = ({ state, statusIsFresh, onSuccess }: HeaderProps) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState<Loading>('');
  const [isAutostart, setIsAutostart] = useState(false);
  const [autostartLoading, setAutostartLoading] = useState(false);
  const [preferenceUncertain, setPreferenceUncertain] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const isMounted = useRef(true);
  const preferenceRequestId = useRef(0);
  const autostartOperationId = useRef(0);
  const hasKnownInstalledState = !!state && state !== 'notInstall';
  // Only expose destructive recovery actions after the UI has observed an
  // installed state. A later failed refresh keeps the last known state, so
  // Stop/Restart remain available for recovery without exposing them during
  // the initial unknown-status load.
  const showRecoveryActions = hasKnownInstalledState;

  const refreshPreference = useCallback(
    async (reportError = true, clearError = true): Promise<string | undefined> => {
      const currentRequestId = ++preferenceRequestId.current;
      try {
        const rsp: any = await vpnApi.getPreference();
        if (!isMounted.current || currentRequestId !== preferenceRequestId.current)
          return undefined;

        if (rsp.code !== 0) {
          if (reportError) setErrMsg(rsp.msg);
          return undefined;
        }

        const vpn = rsp.data?.vpn;
        setIsAutostart(vpn === 'netbird');
        if (clearError) setErrMsg('');
        return vpn;
      } catch (err: any) {
        if (!isMounted.current || currentRequestId !== preferenceRequestId.current)
          return undefined;
        if (reportError) setErrMsg(err?.message || 'Failed to read VPN preference');
        return undefined;
      }
    },
    []
  );

  async function reconcileUncertainPreference(currentOperationId: number) {
    const confirmationDeadline = Date.now() + PREFERENCE_CONFIRMATION_WINDOW;
    let retryDelay = PREFERENCE_RECHECK_INTERVAL;
    while (true) {
      const vpn = await refreshPreference(false, false);
      if (!isMounted.current || currentOperationId !== autostartOperationId.current) return;

      if (vpn === 'netbird') {
        setPreferenceUncertain(false);
        setErrMsg('');
        onSuccess();
        return;
      }

      // An authoritative value for the other supported VPN proves that this
      // POST did not take effect only after its server-side confirmation
      // window. Until then the handler may still be completing after the
      // transport failure. Invalid values and read failures stay unknown.
      if (vpn === 'tailscale' && Date.now() >= confirmationDeadline) {
        setPreferenceUncertain(false);
        setErrMsg(t('settings.netbird.preferenceNotChanged'));
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, retryDelay));
      if (!isMounted.current || currentOperationId !== autostartOperationId.current) return;
      retryDelay = Math.min(retryDelay * 2, PREFERENCE_MAX_RECHECK_INTERVAL);
    }
  }

  useEffect(() => {
    // Invalidating both request counters prevents a late response from a
    // previous Settings mount from changing the newly mounted panel.
    isMounted.current = true;
    void refreshPreference();

    return () => {
      isMounted.current = false;
      preferenceRequestId.current += 1;
      autostartOperationId.current += 1;
    };
  }, [refreshPreference]);

  async function handleAutostartChange(checked: boolean) {
    if (!checked || autostartLoading) return;
    const currentOperationId = ++autostartOperationId.current;
    // A request that began before the mutation cannot authoritatively update
    // the switch after it completes.
    preferenceRequestId.current += 1;
    setPreferenceUncertain(false);
    setAutostartLoading(true);
    setErrMsg('');

    try {
      const rsp: any = await vpnApi.setPreference('netbird');
      if (!isMounted.current || currentOperationId !== autostartOperationId.current) return;

      // Every failure code arrives with HTTP 200, so flipping the switch on a
      // resolved request alone would report success while the device may have
      // no VPN running at all.
      if (rsp.code !== 0) {
        setErrMsg(rsp.msg);
        return;
      }

      setIsAutostart(true);
      onSuccess();
    } catch {
      if (!isMounted.current || currentOperationId !== autostartOperationId.current) return;

      // A transport timeout does not cancel the server handler. Do not retry a
      // state-changing request: re-read its authoritative result instead.
      setErrMsg(t('settings.netbird.preferenceUnknown'));
      setPreferenceUncertain(true);
      await reconcileUncertainPreference(currentOperationId);
    } finally {
      if (isMounted.current && currentOperationId === autostartOperationId.current) {
        setAutostartLoading(false);
      }
    }
  }

  function restart() {
    if (loading !== '') return;
    setLoading('restarting');

    setErrMsg('');

    api
      .restart()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
        }
      })
      .catch((err) => {
        setErrMsg(err.message || 'Restart failed');
      })
      .finally(() => {
        setLoading('');
        onSuccess();
      });
  }

  function stop() {
    if (loading !== '') return;
    setLoading('stopping');

    setErrMsg('');

    api
      .stop()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
        }
      })
      .catch((err) => {
        setErrMsg(err.message || 'Stop failed');
      })
      .finally(() => {
        setLoading('');
        onSuccess();
      });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-base">{t('settings.netbird.title')}</span>

          {hasKnownInstalledState && (
            <Popconfirm
              title={t('settings.netbird.autostartConfirm')}
              description={
                <div className="max-w-[320px] text-xs text-neutral-400">
                  {t('settings.netbird.autostartWarning')}
                </div>
              }
              onConfirm={() => handleAutostartChange(true)}
              okText={t('settings.netbird.okBtn')}
              cancelText={t('settings.netbird.cancelBtn')}
              placement="bottom"
              disabled={isAutostart || autostartLoading || preferenceUncertain}
            >
              <Switch
                checked={isAutostart}
                loading={autostartLoading || preferenceUncertain}
                size="small"
                title={t('settings.netbird.autostart')}
                disabled={!statusIsFresh || isAutostart || autostartLoading || preferenceUncertain}
              />
            </Popconfirm>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {showRecoveryActions && (
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
                description={
                  <div className="max-w-[320px] space-y-1">
                    <div>{t('settings.netbird.stopDesc')}</div>
                    <div className="text-xs text-neutral-400">
                      {t('settings.netbird.stopWarning')}
                    </div>
                  </div>
                }
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

              {/* Stop/Restart and uninstall are available only after a
                  confirmed installed state. */}
              {hasKnownInstalledState && (
                <Popover
                  content={<Uninstall onSuccess={onSuccess} />}
                  placement="bottomRight"
                  arrow={false}
                >
                  <div className="flex cursor-pointer rounded p-1 text-neutral-300 hover:bg-neutral-600">
                    <EllipsisIcon size={18} />
                  </div>
                </Popover>
              )}
            </>
          )}
        </div>
      </div>

      {errMsg && (
        <ErrorHelp error={errMsg} onRefresh={onSuccess} canRestart={hasKnownInstalledState} />
      )}
    </>
  );
};
