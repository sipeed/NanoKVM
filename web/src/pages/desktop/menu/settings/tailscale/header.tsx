import { useCallback, useEffect, useRef, useState } from 'react';
import { message, Popconfirm, Popover, Switch } from 'antd';
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

export const Header = ({ state, onSuccess }: HeaderProps) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState<Loading>('');
  const [isAutostart, setIsAutostart] = useState(false);
  const [autostartLoading, setAutostartLoading] = useState(false);
  const [preferenceUncertain, setPreferenceUncertain] = useState(false);
  const isMounted = useRef(true);
  const preferenceRequestId = useRef(0);
  const autostartOperationId = useRef(0);

  const refreshPreference = useCallback(
    async (reportError = true, clearError = true): Promise<string | undefined> => {
      const currentRequestId = ++preferenceRequestId.current;
      try {
        const rsp: any = await vpnApi.getPreference();
        if (!isMounted.current || currentRequestId !== preferenceRequestId.current)
          return undefined;

        if (rsp.code !== 0) {
          if (reportError) message.error(rsp.msg);
          return undefined;
        }

        const vpn = rsp.data?.vpn;
        setIsAutostart(vpn === 'tailscale');
        if (clearError) message.destroy('tailscale-preference-unknown');
        return vpn;
      } catch {
        if (!isMounted.current || currentRequestId !== preferenceRequestId.current)
          return undefined;
        // Leave the switch off as the safe default. A failed mutation has already
        // shown its unknown-result warning before this reconciliation read.
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

      if (vpn === 'tailscale') {
        setPreferenceUncertain(false);
        message.destroy('tailscale-preference-unknown');
        onSuccess();
        return;
      }

      // An authoritative value for the other supported VPN proves that this
      // POST did not take effect only after its server-side confirmation
      // window. Until then the handler may still be completing after the
      // transport failure. Invalid values and read failures stay unknown.
      if (vpn === 'netbird' && Date.now() >= confirmationDeadline) {
        setPreferenceUncertain(false);
        message.destroy('tailscale-preference-unknown');
        message.error(t('settings.tailscale.preferenceNotChanged'));
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, retryDelay));
      if (!isMounted.current || currentOperationId !== autostartOperationId.current) return;
      retryDelay = Math.min(retryDelay * 2, PREFERENCE_MAX_RECHECK_INTERVAL);
    }
  }

  useEffect(() => {
    isMounted.current = true;
    void refreshPreference();

    return () => {
      isMounted.current = false;
      preferenceRequestId.current += 1;
      autostartOperationId.current += 1;
      // message.loading is global rather than component-owned; closing the
      // panel must also close a still-pending ambiguity notice.
      message.destroy('tailscale-preference-unknown');
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

    try {
      const rsp: any = await vpnApi.setPreference('tailscale');
      if (!isMounted.current || currentOperationId !== autostartOperationId.current) return;

      // Failure codes arrive with HTTP 200, so switching on a resolved request
      // alone would show autostart as enabled while the device may have no VPN
      // running.
      if (rsp.code !== 0) {
        message.error(rsp.msg);
        return;
      }

      setIsAutostart(true);
      onSuccess();
    } catch {
      if (!isMounted.current || currentOperationId !== autostartOperationId.current) return;

      // The server may still be completing the requested switch. Re-read
      // instead of issuing an automatic second state-changing request.
      setPreferenceUncertain(true);
      message.loading({
        content: t('settings.tailscale.preferenceUnknown'),
        key: 'tailscale-preference-unknown',
        duration: 0
      });
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
            description={
              <div className="max-w-[320px] text-xs text-neutral-400">
                {t('settings.tailscale.autostartWarning')}
              </div>
            }
            onConfirm={() => handleAutostartChange(true)}
            okText={t('settings.tailscale.okBtn')}
            cancelText={t('settings.tailscale.cancelBtn')}
            placement="bottom"
            disabled={isAutostart || autostartLoading || preferenceUncertain}
          >
            <Switch
              checked={isAutostart}
              loading={autostartLoading || preferenceUncertain}
              size="small"
              title={t('settings.tailscale.autostart')}
              disabled={isAutostart || autostartLoading || preferenceUncertain}
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
              description={
                <div className="max-w-[320px] space-y-1">
                  <div>{t('settings.tailscale.stopDesc')}</div>
                  <div className="text-xs text-neutral-400">
                    {t('settings.tailscale.stopWarning')}
                  </div>
                </div>
              }
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
