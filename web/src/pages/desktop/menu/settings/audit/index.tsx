import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Select, Switch, Table, Tag, Tooltip, message } from 'antd';
import { RefreshCwIcon, ScrollTextIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/auth.ts';

type Entry = {
  time: string;
  user: string;
  role?: string;
  ip: string;
  method: string;
  path: string;
  action?: string;
  status: number;
  result?: string;
  ms?: number;
};

const roleColor: Record<string, string> = {
  admin: 'red',
  operator: 'blue',
  viewer: 'default'
};

// Collapse dynamic path segments (e.g. /api/auth/users/alice) back to their
// route pattern so they can be looked up in actionKeys below.
function normalizePath(path: string): string {
  return path
    .replace(/^\/api\/auth\/users\/[^/]+\/password$/, '/api/auth/users/:username/password')
    .replace(/^\/api\/auth\/users\/[^/]+$/, '/api/auth/users/:username')
    .replace(/^\/api\/vm\/autostart\/[^/]+$/, '/api/vm/autostart/:name')
    .replace(/\/$/, ''); // tolerate trailing slashes (e.g. /vm/mouse-jiggler/)
}

// Map "METHOD path" to a short i18n key under settings.audit.actions. Method is
// part of the key because some paths serve several verbs (PUT vs DELETE on a
// user, POST vs DELETE on a shortcut/autostart). Paths not listed here fall back
// to the raw request path in the UI.
const actionKeys: Record<string, string> = {
  'POST /api/auth/login': 'login',
  'POST /api/auth/logout': 'logout',
  'POST /api/auth/password': 'changePassword',
  'POST /api/auth/users': 'createUser',
  'PUT /api/auth/users/:username': 'updateUser',
  'DELETE /api/auth/users/:username': 'deleteUser',
  'POST /api/auth/users/:username/password': 'changeUserPassword',
  'POST /api/auth/audit/config': 'auditConfig',
  'DELETE /api/auth/audit/logs': 'clearAudit',
  'POST /api/vm/gpio': 'gpio',
  'POST /api/vm/system/reboot': 'reboot',
  'POST /api/usb/recover': 'usbRecover',
  'POST /api/vm/ssh/enable': 'sshEnable',
  'POST /api/vm/ssh/disable': 'sshDisable',
  'POST /api/vm/hdmi/enable': 'hdmiEnable',
  'POST /api/vm/hdmi/disable': 'hdmiDisable',
  'POST /api/vm/hdmi/reset': 'hdmiReset',
  'POST /api/vm/mdns/enable': 'mdnsEnable',
  'POST /api/vm/mdns/disable': 'mdnsDisable',
  'POST /api/vm/hostname': 'hostname',
  'POST /api/vm/web-title': 'webTitle',
  'POST /api/vm/tls': 'tls',
  'POST /api/vm/oled': 'oled',
  'POST /api/vm/swap': 'swap',
  'POST /api/vm/memory/limit': 'memoryLimit',
  'POST /api/vm/device/virtual': 'virtualDevice',
  'POST /api/vm/mouse-jiggler': 'mouseJiggler',
  'POST /api/vm/script/run': 'runScript',
  'POST /api/vm/script/upload': 'uploadScript',
  'DELETE /api/vm/script': 'deleteScript',
  'POST /api/vm/autostart/:name': 'autostartSet',
  'DELETE /api/vm/autostart/:name': 'autostartDelete',
  'POST /api/vm/terminal': 'terminal',
  'POST /api/hid/paste': 'hidPaste',
  'POST /api/hid/mode': 'hidMode',
  'POST /api/hid/reset': 'hidReset',
  'POST /api/hid/shortcut': 'shortcutAdd',
  'DELETE /api/hid/shortcut': 'shortcutDelete',
  'POST /api/hid/shortcut/leader-key': 'leaderKey',
  'POST /api/network/dns': 'setDns',
  'POST /api/network/ip': 'setIp',
  'POST /api/network/wifi/connect': 'wifiConnect',
  'POST /api/network/wifi/disconnect': 'wifiDisconnect',
  'POST /api/network/wifi': 'wifiConnect',
  'POST /api/network/wol': 'wol',
  'POST /api/network/wol/mac/name': 'wolMacName',
  'DELETE /api/network/wol/mac': 'wolMacDelete',
  'POST /api/storage/image/mount': 'imageMount',
  'POST /api/storage/image/delete': 'imageDelete',
  'POST /api/download/image': 'imageDownload',
  'POST /api/download/file': 'imageDownload',
  'POST /api/application/update': 'firmwareUpdate',
  'POST /api/application/update/offline': 'firmwareUpdateOffline',
  'POST /api/application/preview': 'firmwarePreview',
  'POST /api/tailscale/up': 'tsUp',
  'POST /api/tailscale/down': 'tsDown',
  'POST /api/tailscale/start': 'tsStart',
  'POST /api/tailscale/stop': 'tsStop',
  'POST /api/tailscale/restart': 'tsRestart',
  'POST /api/tailscale/install': 'tsInstall',
  'POST /api/tailscale/uninstall': 'tsUninstall',
  'POST /api/tailscale/login': 'tsLogin',
  'POST /api/tailscale/logout': 'tsLogout'
};

function resolveActionKey(method: string, path: string): string | null {
  return actionKeys[`${method} ${normalizePath(path)}`] ?? null;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return iso;
  }
  // Local time, no seconds clutter beyond what's useful
  return d.toLocaleString();
}

export const Audit = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userFilter, setUserFilter] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [enabled, setEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadConfig();
    load();
  }, []);

  function loadConfig() {
    api
      .getAuditConfig()
      .then((rsp: any) => {
        if (rsp.code === 0) {
          setEnabled(!!rsp.data?.enabled);
        }
      })
      .catch(() => {});
  }

  function toggleEnabled(next: boolean) {
    setToggling(true);
    api
      .setAuditConfig(next)
      .then((rsp: any) => {
        setToggling(false);
        if (rsp.code === 0) {
          setEnabled(next);
          message.success(
            next ? t('settings.audit.enableSuccess') : t('settings.audit.disableSuccess')
          );
          if (next) {
            load();
          }
        } else {
          message.error(t('settings.audit.updateFailed'));
        }
      })
      .catch(() => {
        setToggling(false);
        message.error(t('settings.audit.updateFailed'));
      });
  }

  function load() {
    setLoading(true);
    api
      .getAuditLog(500)
      .then((rsp: any) => {
        setLoading(false);
        if (rsp.code === 0) {
          setEntries(rsp.data?.entries || []);
        } else {
          message.error(t('settings.audit.loadFailed'));
        }
      })
      .catch(() => {
        setLoading(false);
        message.error(t('settings.audit.loadFailed'));
      });
  }

  function clearLogs() {
    if (clearing) return;

    Modal.confirm({
      title: t('settings.audit.clearConfirmTitle'),
      icon: <Trash2Icon size={20} className="mr-2 text-red-400" />,
      content: t('settings.audit.clearConfirmText'),
      okText: t('settings.audit.clearConfirmOk'),
      cancelText: t('settings.audit.clearConfirmCancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        setClearing(true);
        return api
          .clearAuditLog()
          .then((rsp: any) => {
            if (rsp.code === 0) {
              message.success(t('settings.audit.clearSuccess'));
              load();
            } else {
              message.error(t('settings.audit.clearFailed'));
            }
          })
          .catch(() => {
            message.error(t('settings.audit.clearFailed'));
          })
          .finally(() => {
            setClearing(false);
          });
      }
    });
  }

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (userFilter && !e.user?.toLowerCase().includes(userFilter.toLowerCase())) {
        return false;
      }
      if (resultFilter !== 'all') {
        if (resultFilter === 'success' && e.result === 'failure') return false;
        if (resultFilter === 'failure' && e.result !== 'failure') return false;
      }
      return true;
    });
  }, [entries, userFilter, resultFilter]);

  const columns = [
    {
      title: t('settings.audit.colTime'),
      dataIndex: 'time',
      key: 'time',
      width: 170,
      render: (time: string) => <span className="whitespace-nowrap text-xs">{formatTime(time)}</span>
    },
    {
      title: t('settings.audit.colUser'),
      dataIndex: 'user',
      key: 'user',
      render: (user: string, r: Entry) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono">{user}</span>
          {r.role && (
            <Tag color={roleColor[r.role] || 'default'} className="m-0">
              {r.role}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: t('settings.audit.colAction'),
      key: 'action',
      render: (_: any, r: Entry) => {
        const key = resolveActionKey(r.method, r.path);
        const label = key ? t(`settings.audit.actions.${key}`) : r.action || r.path;
        return (
          <Tooltip title={`${r.method} ${r.path}`}>
            <span>{label}</span>
          </Tooltip>
        );
      }
    },
    {
      title: t('settings.audit.colIp'),
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (ip: string) => <span className="font-mono text-xs text-neutral-400">{ip}</span>
    },
    {
      title: t('settings.audit.colResult'),
      key: 'result',
      width: 90,
      render: (_: any, r: Entry) =>
        r.result === 'failure' ? (
          <Tag color="red" className="m-0">
            {t('settings.audit.failure')}
          </Tag>
        ) : (
          <Tag color="green" className="m-0">
            {t('settings.audit.success')}
          </Tag>
        )
    }
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-base">
          <ScrollTextIcon size={16} />
          <span>{t('settings.audit.title')}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-400">{t('settings.audit.enabled')}</span>
            <Switch size="small" checked={enabled} loading={toggling} onChange={toggleEnabled} />
          </div>
          <Button
            size="small"
            icon={<RefreshCwIcon size={14} />}
            onClick={load}
            loading={loading}
            disabled={!enabled}
          >
            {t('settings.audit.refresh')}
          </Button>
          <Button
            size="small"
            danger
            icon={<Trash2Icon size={14} />}
            onClick={clearLogs}
            loading={clearing}
          >
            {t('settings.audit.clearLog')}
          </Button>
        </div>
      </div>

      <div className="my-3 flex flex-wrap items-center gap-2">
        <Input
          allowClear
          size="small"
          style={{ width: 180 }}
          placeholder={t('settings.audit.filterUser')}
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        />
        <Select
          size="small"
          style={{ width: 150 }}
          value={resultFilter}
          onChange={setResultFilter}
          options={[
            { value: 'all', label: t('settings.audit.allResults') },
            { value: 'success', label: t('settings.audit.success') },
            { value: 'failure', label: t('settings.audit.failure') }
          ]}
        />
        <span className="text-xs text-neutral-500">
          {t('settings.audit.count', { count: filtered.length })}
        </span>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey={(r: Entry, index?: number) => `${r.time}-${index}`}
        loading={loading}
        size="small"
        pagination={{ pageSize: 20, size: 'small' }}
        scroll={{ x: true }}
        className="rounded-lg"
      />
    </>
  );
};
