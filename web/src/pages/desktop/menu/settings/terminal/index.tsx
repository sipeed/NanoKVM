import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Divider, Modal, Spin, Tooltip, message } from 'antd';
import { RefreshCcwIcon, SquareTerminalIcon, UsbIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import type { TerminalSession } from '@/api/vm.ts';

const refreshInterval = 3000;

function splitDuration(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return { seconds, minutes, hours };
}

type SessionRowProps = {
  session: TerminalSession;
  now: number;
  closing: boolean;
  onClose: () => void;
};

const SessionRow = ({ session, now, closing, onClose }: SessionRowProps) => {
  const { t } = useTranslation();
  const { seconds, minutes, hours } = splitDuration(now - session.createdAt);

  let duration = t('settings.terminal.durationSeconds', { seconds });
  if (hours > 0) {
    duration = t('settings.terminal.durationHours', { hours, minutes: minutes % 60 });
  } else if (minutes > 0) {
    duration = t('settings.terminal.durationMinutes', { minutes });
  }

  const isSerial = session.kind === 'serial';
  const title = isSerial
    ? `${t('settings.terminal.serial')}${
        session.port
          ? ` · ${t('settings.terminal.serialParams', {
              port: session.port,
              baud: session.baud || '-'
            })}`
          : ''
      }`
    : t('settings.terminal.shell');

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-800/40">
      <div className="flex min-w-0 items-center space-x-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-700/40 text-neutral-300">
          {isSerial ? <UsbIcon size={16} /> : <SquareTerminalIcon size={16} />}
        </div>

        <div className="flex min-w-0 flex-col space-y-0.5">
          <span className="truncate text-sm font-medium text-neutral-200">{title}</span>

          <div className="flex min-w-0 items-center space-x-1.5 text-xs text-neutral-500">
            {session.username && (
              <>
                <span className="truncate">{session.username}</span>
                <span>·</span>
              </>
            )}
            <Tooltip title={session.userAgent || '-'} placement="top" mouseEnterDelay={0.4}>
              <span className="truncate cursor-default">{session.clientIp || '-'}</span>
            </Tooltip>
            <span>·</span>
            <span className="shrink-0">{duration}</span>
          </div>
        </div>
      </div>

      <Tooltip title={t('settings.terminal.close')} placement="top" mouseEnterDelay={0.4}>
        <Button
          type="text"
          size="small"
          danger
          loading={closing}
          className="shrink-0 text-neutral-400 hover:text-red-400"
          icon={<XIcon size={15} />}
          onClick={onClose}
        />
      </Tooltip>
    </div>
  );
};

export const TerminalSessions = () => {
  const { t } = useTranslation();
  const [modal, contextHolder] = Modal.useModal();

  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [closingId, setClosingId] = useState('');

  const silentRefreshRef = useRef(false);
  const mountedRef = useRef(true);

  const load = useCallback(
    (silent = false) => {
      if (silent) {
        if (silentRefreshRef.current) return;
        silentRefreshRef.current = true;
      } else {
        setIsLoading(true);
      }

      api
        .getTerminalSessions()
        .then((rsp) => {
          if (!mountedRef.current) return;
          if (rsp.code !== 0) {
            if (!silent) message.error(rsp.msg || t('settings.terminal.failed'));
            return;
          }
          setSessions(rsp.data?.sessions ?? []);
        })
        .catch(() => {
          if (!silent && mountedRef.current) message.error(t('settings.terminal.failed'));
        })
        .finally(() => {
          if (silent) {
            silentRefreshRef.current = false;
          } else if (mountedRef.current) {
            setIsLoading(false);
          }
        });
    },
    [t]
  );

  useEffect(() => {
    mountedRef.current = true;
    load();

    const refreshTimer = window.setInterval(() => load(true), refreshInterval);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [load]);

  function closeSession(session: TerminalSession) {
    modal.confirm({
      title: t('settings.terminal.closeTitle'),
      content: (
        <span className="text-sm text-neutral-400">{t('settings.terminal.closeDesc')}</span>
      ),
      okText: t('settings.terminal.closeOk'),
      cancelText: t('settings.terminal.closeCancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setClosingId(session.id);
        try {
          const rsp = await api.closeTerminalSession(session.id);
          if (rsp.code !== 0) {
            message.error(rsp.msg || t('settings.terminal.failed'));
            return;
          }
          setSessions((items) => items.filter((item) => item.id !== session.id));
        } catch {
          message.error(t('settings.terminal.failed'));
        } finally {
          if (mountedRef.current) {
            setClosingId('');
          }
        }
      }
    });
  }

  return (
    <>
      {contextHolder}

      <div className="flex items-center justify-between">
        <div className="text-base">{t('settings.terminal.title')}</div>

        <Button
          type="text"
          size="small"
          loading={isLoading}
          className="text-neutral-400 hover:text-white"
          icon={<RefreshCcwIcon size={15} />}
          onClick={() => load()}
        >
          {t('settings.terminal.refresh')}
        </Button>
      </div>

      <Divider className="opacity-50" />

      <div className="flex flex-col space-y-4">
        <span className="text-xs text-neutral-500">{t('settings.terminal.description')}</span>

        {isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Spin />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700/60 py-10 text-neutral-500">
            <SquareTerminalIcon size={28} className="mb-2 opacity-60" />
            <span className="text-sm">{t('settings.terminal.empty')}</span>
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800/40 shadow-sm">
            {sessions.map((session, index) => (
              <div key={session.id}>
                {index > 0 && <div className="border-t border-neutral-800" />}
                <SessionRow
                  session={session}
                  now={now}
                  closing={closingId === session.id}
                  onClose={() => closeSession(session)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
