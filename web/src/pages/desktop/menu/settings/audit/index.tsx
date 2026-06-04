import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Switch, Table, Tag, Tooltip, message } from 'antd';
import { RefreshCwIcon, ScrollTextIcon } from 'lucide-react';
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
      render: (_: any, r: Entry) => (
        <Tooltip title={`${r.method} ${r.path}`}>
          <span>{r.action || r.path}</span>
        </Tooltip>
      )
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
