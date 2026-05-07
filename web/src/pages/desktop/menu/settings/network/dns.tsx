import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Input, Segmented } from 'antd';
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import type { DNSMode } from '@/api/network.ts';

type DNSState = {
  mode: DNSMode;
  servers: string[];
  dhcp: string[];
  info: DNSInfo;
};

type DNSInfo = {
  interface?: string;
  type?: string;
  address?: string;
  subnetMask?: string;
  gateway?: string;
};

const maxServers = 6;

function formatInterface(info: DNSInfo) {
  if (!info.interface) return '';
  if (!info.type) return info.interface;

  return `${info.type} (${info.interface})`;
}

function normalizeServers(servers: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const server of servers) {
    const value = normalizeServer(server);
    if (!value || seen.has(value)) continue;

    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

function normalizeServer(server: string) {
  return server.split('#')[0].trim().split(/\s+/)[0] || '';
}

function isValidIP(value: string) {
  return isValidIPv4(value) || isValidIPv6(value);
}

function isValidIPv4(value: string) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;

    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

function isValidIPv6(value: string) {
  if (!value.includes(':')) return false;

  try {
    new URL(`http://[${value}]/`);
    return true;
  } catch {
    return false;
  }
}

const Panel = ({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => {
  return (
    <div className="overflow-hidden rounded-xl bg-neutral-800/50">
      <div className="px-4 pb-1.5 pt-3">
        <div className="font-semibold text-neutral-100">{title}</div>
        {description && (
          <div className="mt-0.5 text-xs leading-snug text-neutral-500">{description}</div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

const InfoRow = ({
  label,
  value,
  isLast = false
}: {
  label: string;
  value?: string;
  isLast?: boolean;
}) => {
  return (
    <div className="px-4">
      <div
        className={`flex min-h-[44px] items-center justify-between ${
          isLast ? '' : 'border-b border-neutral-700/50'
        }`}
      >
        <span className="text-sm text-neutral-300">{label}</span>
        <span className="max-w-[330px] break-all text-right text-sm text-neutral-500">
          {value || '-'}
        </span>
      </div>
    </div>
  );
};

const ServerList = ({ servers }: { servers: string[] }) => {
  const { t } = useTranslation();

  if (!servers.length) {
    return (
      <div className="px-4 py-3 text-sm text-neutral-500">{t('settings.network.dns.none')}</div>
    );
  }

  return (
    <div>
      {servers.map((server, index) => (
        <div key={`${server}-${index}`} className="px-4">
          <div
            className={`min-h-[44px] py-2.5 text-sm text-neutral-400 ${
              index === servers.length - 1 ? '' : 'border-b border-neutral-700/50'
            }`}
          >
            {server}
          </div>
        </div>
      ))}
    </div>
  );
};

const EditableServerRow = ({
  value,
  autoFocus,
  onChange,
  onRemove
}: {
  value: string;
  autoFocus: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
}) => {
  const inputRef = useRef<any>(null);
  const normalized = normalizeServer(value);
  const isInvalid = normalized !== '' && !isValidIP(normalized);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="group px-4 py-1.5">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.0.0.0"
          status={isInvalid ? 'error' : undefined}
        />
        <Button
          size="small"
          shape="circle"
          icon={<XIcon size={14} />}
          onClick={onRemove}
          className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        />
      </div>
    </div>
  );
};

export const DNS = () => {
  const { t } = useTranslation();

  const [mode, setMode] = useState<DNSMode>('dhcp');
  const [originalMode, setOriginalMode] = useState<DNSMode>('dhcp');
  const [servers, setServers] = useState<string[]>([]);
  const [originalServers, setOriginalServers] = useState<string[]>([]);
  const [dhcp, setDHCP] = useState<string[]>([]);
  const [info, setInfo] = useState<DNSInfo>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [focusNewRow, setFocusNewRow] = useState(false);

  useEffect(() => {
    getDNS();
  }, []);

  async function getDNS(showLoading = true) {
    if (showLoading) setIsLoading(true);

    try {
      const rsp = await api.getDNS();
      if (rsp.code !== 0) {
        setError(rsp.msg);
        return;
      }

      const data = rsp.data as DNSState;
      const fetchedMode = data.mode || 'dhcp';
      setMode(fetchedMode);
      setOriginalMode(fetchedMode);

      const fetchedServers = data.servers?.filter(Boolean) || [];
      setServers(fetchedServers);
      setOriginalServers(fetchedServers);
      setDHCP(data.dhcp || []);
      setInfo(data.info || {});
    } catch (err) {
      console.log(err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  async function save() {
    if (isSaving) return;

    setMessage('');
    setError('');

    const normalized = normalizeServers(servers);
    if (mode === 'manual' && normalized.length === 0) {
      setError(t('settings.network.dns.invalid'));
      return;
    }

    if (mode === 'manual' && normalized.some((server) => !isValidIP(server))) {
      setError(t('settings.network.dns.invalid'));
      return;
    }

    setIsSaving(true);
    try {
      const rsp = await api.setDNS(mode, mode === 'manual' ? normalized : []);
      if (rsp.code !== 0) {
        setError(rsp.msg || t('settings.network.dns.saveFailed'));
        return;
      }

      setServers(normalized);
      setOriginalServers(normalized);
      setOriginalMode(mode);

      await getDNS(false);
      setMessage(t('settings.network.dns.saved'));
    } catch (err) {
      console.log(err);
      setError(t('settings.network.dns.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  function addServer() {
    if (servers.length >= maxServers) return;
    setMessage('');
    setError('');
    setServers([...servers, '']);
    setFocusNewRow(true);
  }

  function removeServer(index: number) {
    setMessage('');
    setError('');
    setServers(servers.filter((_, i) => i !== index));
  }

  function updateServer(index: number, value: string) {
    setMessage('');
    setError('');
    const updated = [...servers];
    updated[index] = value;
    setServers(updated);
  }

  const normalizedServers = normalizeServers(servers);
  const hasInvalidServer =
    mode === 'manual' &&
    servers.some((server) => {
      const val = normalizeServer(server);
      return val !== '' && !isValidIP(val);
    });
  const isExceedMax = mode === 'manual' && normalizedServers.length > maxServers;
  const hasChanges =
    mode !== originalMode ||
    normalizedServers.join(',') !== normalizeServers(originalServers).join(',');

  const statusText = error || message || (hasChanges ? t('settings.network.dns.unsaved') : '');
  const statusColor = error ? 'text-red-400' : message ? 'text-green-400' : 'text-yellow-400/80';
  const serversDescription =
    mode === 'dhcp'
      ? t('settings.network.dns.dhcpServersDescription')
      : t('settings.network.dns.manualServersDescription');

  const canAdd = !isLoading && !isSaving && servers.length < maxServers;

  return (
    <div className="flex flex-col space-y-5">
      {/* Header row: title + segmented control */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.network.dns.title')}</span>
          <span className="text-xs text-neutral-500">{t('settings.network.dns.description')}</span>
        </div>

        <Segmented
          disabled={isLoading || isSaving}
          value={mode}
          onChange={(val) => {
            setMode(val as DNSMode);
            setMessage('');
            setError('');
          }}
          options={[
            { label: t('settings.network.dns.dhcp'), value: 'dhcp' },
            { label: t('settings.network.dns.manual'), value: 'manual' }
          ]}
        />
      </div>

      <div className="space-y-5">
        <Panel title={t('settings.network.dns.networkDetails')}>
          <InfoRow label={t('settings.network.dns.interface')} value={formatInterface(info)} />
          <InfoRow label={t('settings.network.dns.ipAddress')} value={info.address} />
          <InfoRow label={t('settings.network.dns.subnetMask')} value={info.subnetMask} />
          <InfoRow label={t('settings.network.dns.router')} value={info.gateway} isLast />
        </Panel>

        <Panel title={t('settings.network.dns.dnsServers')} description={serversDescription}>
          {mode === 'manual' ? (
            <div>
              {servers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-neutral-500">
                  {t('settings.network.dns.none')}
                </div>
              ) : (
                servers.map((server, index) => (
                  <EditableServerRow
                    key={index}
                    value={server}
                    autoFocus={focusNewRow && index === servers.length - 1}
                    onChange={(val) => updateServer(index, val)}
                    onRemove={() => removeServer(index)}
                  />
                ))
              )}

              {/* Add server button */}
              {canAdd && (
                <div className="px-4 py-1.5 pb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="dashed"
                      className="flex-1"
                      icon={<PlusIcon size={14} />}
                      onClick={addServer}
                    >
                      {t('settings.network.dns.add')}
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      className="invisible shrink-0"
                      icon={<XIcon size={14} />}
                    />
                  </div>
                </div>
              )}

              {/* Validation hints */}
              {(hasInvalidServer || isExceedMax) && (
                <div className="space-y-1 px-4 pb-3">
                  {hasInvalidServer && (
                    <div className="text-xs text-red-400">{t('settings.network.dns.invalid')}</div>
                  )}
                  {isExceedMax && (
                    <div className="text-xs text-red-400">
                      {t('settings.network.dns.maxServers', { count: maxServers })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <ServerList servers={dhcp} />
          )}
        </Panel>
      </div>

      {/* Footer: status + save button */}
      {(hasChanges || statusText) && (
        <div className="flex items-center justify-between">
          <span className={`text-xs ${statusColor}`}>{statusText}</span>

          <Button
            type={hasChanges ? 'primary' : 'default'}
            icon={message ? <CheckIcon size={14} /> : undefined}
            loading={isSaving}
            disabled={
              isLoading || (!hasChanges && !hasInvalidServer) || hasInvalidServer || isExceedMax
            }
            onClick={save}
          >
            {t('settings.network.dns.save')}
          </Button>
        </div>
      )}
    </div>
  );
};
