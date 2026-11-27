import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { Button, Divider, Input, InputNumber, message, Modal, Spin, Tooltip } from 'antd';
import clsx from 'clsx';
import {
  PencilIcon,
  PlugZapIcon,
  RefreshCcwIcon,
  SquareTerminalIcon,
  UsbIcon,
  XIcon
} from 'lucide-react';
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

function formatSessionStart(createdAt: number, language: string) {
  const date = new Date(createdAt);

  try {
    return new Intl.DateTimeFormat(language.replace('_', '-'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

type SessionRowProps = {
  session: TerminalSession;
  now: number;
  closing: boolean;
  onRename: () => void;
  onReconnect: () => void;
  onClose: () => void;
};

const SessionRow = ({ session, now, closing, onRename, onReconnect, onClose }: SessionRowProps) => {
  const { t, i18n } = useTranslation();
  const { seconds, minutes, hours } = splitDuration(now - session.createdAt);

  let elapsed = t('settings.terminal.elapsedSeconds', { seconds });
  if (hours > 0) {
    elapsed = t('settings.terminal.elapsedHours', { hours, minutes: minutes % 60 });
  } else if (minutes > 0) {
    elapsed = t('settings.terminal.elapsedMinutes', { minutes });
  }

  const startedAt = formatSessionStart(session.createdAt, i18n.resolvedLanguage || i18n.language);
  const startedAtText = t('settings.terminal.startedAt', { time: startedAt, duration: elapsed });

  const isSerial = session.kind === 'serial';
  const defaultTitle = isSerial
    ? `${t('settings.terminal.serial')}${
        session.port
          ? ` · ${t('settings.terminal.serialParams', {
              port: session.port,
              baud: session.baud || '-'
            })}`
          : ''
      }`
    : t('settings.terminal.shell');
  const customName = session.name?.trim() || '';
  const title = customName || defaultTitle;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-800/40">
      <div className="flex min-w-0 items-center space-x-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-700/40 text-neutral-300">
          {isSerial ? <UsbIcon size={16} /> : <SquareTerminalIcon size={16} />}
        </div>

        <div className="flex min-w-0 flex-col space-y-0.5">
          {customName ? (
            <Tooltip title={defaultTitle} placement="top" mouseEnterDelay={0.4}>
              <span className="truncate text-sm font-medium text-neutral-200">{title}</span>
            </Tooltip>
          ) : (
            <span className="truncate text-sm font-medium text-neutral-200">{title}</span>
          )}

          <div className="flex min-w-0 items-center space-x-1.5 text-xs text-neutral-500">
            {session.username && (
              <>
                <span className="truncate">{session.username}</span>
                <span>·</span>
              </>
            )}
            <Tooltip title={session.userAgent || '-'} placement="top" mouseEnterDelay={0.4}>
              <span className="cursor-default truncate">{session.clientIp || '-'}</span>
            </Tooltip>
            <span>·</span>
            <span className="flex shrink-0 items-center space-x-1">
              <span
                className={clsx(
                  'h-1.5 w-1.5 rounded-full',
                  session.attached ? 'bg-green-500' : 'bg-neutral-500'
                )}
              />
              <span>
                {session.attached
                  ? t('settings.terminal.attached')
                  : t('settings.terminal.detached')}
              </span>
            </span>
          </div>

          <span className="truncate text-xs text-neutral-500">{startedAtText}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center space-x-1">
        <Tooltip title={t('settings.terminal.rename')} placement="top" mouseEnterDelay={0.4}>
          <Button
            type="text"
            size="small"
            className="text-neutral-400 hover:text-white"
            icon={<PencilIcon size={15} />}
            onClick={onRename}
          />
        </Tooltip>

        <Tooltip title={t('settings.terminal.reconnect')} placement="top" mouseEnterDelay={0.4}>
          <Button
            type="text"
            size="small"
            className="text-neutral-400 hover:text-white"
            icon={<PlugZapIcon size={15} />}
            onClick={onReconnect}
          />
        </Tooltip>

        <Tooltip title={t('settings.terminal.close')} placement="top" mouseEnterDelay={0.4}>
          <Button
            type="text"
            size="small"
            danger
            loading={closing}
            className="text-neutral-400 hover:text-red-400"
            icon={<XIcon size={15} />}
            onClick={onClose}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export const TerminalSessions = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [modal, contextHolder] = Modal.useModal();

  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [maxSessions, setMaxSessions] = useState(8);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [closingId, setClosingId] = useState('');
  const [renamingSession, setRenamingSession] = useState<TerminalSession | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const silentRefreshRef = useRef(false);
  const mountedRef = useRef(true);

  const canManageConfig = hasPermission('device');

  const loadConfig = useCallback(() => {
    setIsConfigLoading(true);
    api
      .getTerminalSessionConfig()
      .then((rsp) => {
        if (!mountedRef.current) return;
        if (rsp.code !== 0) {
          message.error(rsp.msg || t('settings.terminal.failed'));
          return;
        }
        setMaxSessions(rsp.data?.maxSessions ?? 8);
      })
      .catch(() => {
        if (mountedRef.current) message.error(t('settings.terminal.failed'));
      })
      .finally(() => {
        if (mountedRef.current) setIsConfigLoading(false);
      });
  }, [t]);

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
    loadConfig();

    const refreshTimer = window.setInterval(() => load(true), refreshInterval);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [load, loadConfig]);

  async function saveConfig() {
    if (!canManageConfig || isConfigSaving) return;

    setIsConfigSaving(true);
    try {
      const rsp = await api.setTerminalSessionConfig({ maxSessions });
      if (rsp.code !== 0) {
        message.error(rsp.msg || t('settings.terminal.failed'));
        return;
      }
      setMaxSessions(rsp.data?.maxSessions ?? maxSessions);
      message.success(t('settings.terminal.sessionLimitSaved'));
    } catch {
      message.error(t('settings.terminal.failed'));
    } finally {
      if (mountedRef.current) setIsConfigSaving(false);
    }
  }

  function closeSession(session: TerminalSession) {
    modal.confirm({
      title: t('settings.terminal.closeTitle'),
      content: <span className="text-sm text-neutral-400">{t('settings.terminal.closeDesc')}</span>,
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

  function reconnectSession(session: TerminalSession) {
    const openTerminal = () => {
      window.open(`/#terminal?session=${encodeURIComponent(session.id)}`, '_blank');
    };

    if (!session.attached) {
      openTerminal();
      return;
    }

    modal.confirm({
      title: t('settings.terminal.reconnectTitle'),
      content: (
        <span className="text-sm text-neutral-400">{t('settings.terminal.reconnectDesc')}</span>
      ),
      okText: t('settings.terminal.reconnectOk'),
      cancelText: t('settings.terminal.reconnectCancel'),
      onOk: openTerminal
    });
  }

  function startRename(session: TerminalSession) {
    setRenamingSession(session);
    setRenameValue(session.name ?? '');
  }

  async function submitRename() {
    const target = renamingSession;
    if (!target || isRenaming) return;

    const name = renameValue.trim();
    setIsRenaming(true);
    try {
      const rsp = await api.renameTerminalSession(target.id, name);
      if (rsp.code !== 0) {
        message.error(rsp.msg || t('settings.terminal.failed'));
        return;
      }
      setSessions((items) =>
        items.map((item) => (item.id === target.id ? { ...item, name } : item))
      );
      setRenamingSession(null);
    } catch {
      message.error(t('settings.terminal.failed'));
    } finally {
      if (mountedRef.current) {
        setIsRenaming(false);
      }
    }
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

        <div className="flex w-full flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col space-y-1">
            <span className="text-sm">{t('settings.terminal.sessionLimit')}</span>
            <span className="text-xs text-neutral-500">
              {t('settings.terminal.sessionLimitHint')}
            </span>
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <InputNumber
              min={0}
              precision={0}
              value={maxSessions}
              disabled={isConfigLoading || !canManageConfig}
              addonAfter={t('settings.terminal.sessionsUnit')}
              onChange={(value) => {
                if (value !== null) setMaxSessions(value);
              }}
            />
            {canManageConfig && (
              <Button
                type="primary"
                loading={isConfigSaving}
                disabled={isConfigLoading || maxSessions < 0}
                onClick={saveConfig}
              >
                {t('settings.terminal.saveSessionLimit')}
              </Button>
            )}
          </div>
        </div>

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
                  onRename={() => startRename(session)}
                  onReconnect={() => reconnectSession(session)}
                  onClose={() => closeSession(session)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={renamingSession !== null}
        title={t('settings.terminal.renameTitle')}
        okText={t('settings.terminal.renameOk')}
        cancelText={t('settings.terminal.renameCancel')}
        confirmLoading={isRenaming}
        onOk={submitRename}
        onCancel={() => {
          if (!isRenaming) {
            setRenamingSession(null);
          }
        }}
        destroyOnHidden
      >
        <Input
          autoFocus
          maxLength={64}
          value={renameValue}
          placeholder={t('settings.terminal.renamePlaceholder')}
          onChange={(event) => setRenameValue(event.target.value)}
          onPressEnter={submitRename}
        />
      </Modal>
    </>
  );
};
