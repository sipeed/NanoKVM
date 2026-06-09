import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Input, Modal, Segmented } from 'antd';
import { CheckIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import type { IPv4Mode } from '@/api/network.ts';

type IPv4Info = {
  interface?: string;
  type?: string;
  address?: string;
  subnetMask?: string;
  gateway?: string;
};

type IPv4State = {
  mode: IPv4Mode;
  address: string;
  subnetMask: string;
  gateway: string;
  info: IPv4Info;
  pending?: boolean;
  remainingSeconds?: number;
};

function formatInterface(info: IPv4Info) {
  if (!info.interface) return '';
  if (!info.type) return info.interface;

  return `${info.type} (${info.interface})`;
}

function isValidIPv4(value: string) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

// Returns the prefix length for a dotted subnet mask, or null if the mask is
// not a valid contiguous netmask.
function maskToPrefix(mask: string): number | null {
  if (!isValidIPv4(mask)) return null;

  const octets = mask.split('.').map(Number);
  let bits = '';
  for (const octet of octets) {
    bits += octet.toString(2).padStart(8, '0');
  }

  // valid mask: ones followed by zeros, no interleaving
  if (!/^1*0*$/.test(bits)) return null;

  const prefix = bits.indexOf('0');
  return prefix === -1 ? 32 : prefix;
}

function sameSubnet(a: string, b: string, prefix: number) {
  const toNum = (ip: string) =>
    ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (toNum(a) & mask) === (toNum(b) & mask);
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

const FieldRow = ({
  label,
  value,
  placeholder,
  invalid,
  onChange,
  isLast = false
}: {
  label: string;
  value: string;
  placeholder: string;
  invalid: boolean;
  onChange: (value: string) => void;
  isLast?: boolean;
}) => {
  return (
    <div className="px-4">
      <div
        className={`flex min-h-[52px] items-center justify-between gap-4 ${
          isLast ? '' : 'border-b border-neutral-700/50'
        }`}
      >
        <span className="shrink-0 text-sm text-neutral-300">{label}</span>
        <Input
          className="max-w-[220px]"
          value={value}
          placeholder={placeholder}
          status={invalid ? 'error' : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
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

export const IPv4 = () => {
  const { t } = useTranslation();

  const [mode, setMode] = useState<IPv4Mode>('dhcp');
  const [originalMode, setOriginalMode] = useState<IPv4Mode>('dhcp');
  const [address, setAddress] = useState('');
  const [subnetMask, setSubnetMask] = useState('');
  const [gateway, setGateway] = useState('');
  const [original, setOriginal] = useState({ address: '', subnetMask: '', gateway: '' });
  const [info, setInfo] = useState<IPv4Info>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [pending, setPending] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getIPv4();
  }, []);

  // Countdown while a static change awaits confirmation. On reaching zero the
  // server has reverted on its own, so reload to reflect the restored config.
  useEffect(() => {
    if (!pending) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPending(false);
          setMessage(t('settings.network.ip.reverted'));
          getIPv4(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  async function confirmChange() {
    if (confirming) return;
    setConfirming(true);
    setError('');

    try {
      const rsp = await api.confirmIPv4();
      if (rsp.code === 0) {
        setPending(false);
        setRemaining(0);
        setMessage(t('settings.network.ip.confirmed'));
        getIPv4(false);
      } else {
        setError(rsp.msg || t('settings.network.ip.confirmFailed'));
      }
    } catch (err) {
      console.log(err);
      setError(t('settings.network.ip.confirmFailed'));
    } finally {
      setConfirming(false);
    }
  }

  function formatRemaining(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function getIPv4(showLoading = true) {
    if (showLoading) setIsLoading(true);

    try {
      const rsp = await api.getIPv4();
      if (rsp.code !== 0) {
        setError(rsp.msg);
        return;
      }

      const data = rsp.data as IPv4State;
      const fetchedMode = data.mode || 'dhcp';
      setMode(fetchedMode);
      setOriginalMode(fetchedMode);

      // Prefill manual fields. In DHCP mode, seed from the currently effective
      // values so switching to "manual" starts from the active address.
      const effectiveAddress = (data.info?.address || '').split('/')[0];
      const addr = data.address || (fetchedMode === 'dhcp' ? effectiveAddress : '');
      const mask = data.subnetMask || (fetchedMode === 'dhcp' ? data.info?.subnetMask || '' : '');
      const gw = data.gateway || (fetchedMode === 'dhcp' ? data.info?.gateway || '' : '');

      setAddress(addr);
      setSubnetMask(mask);
      setGateway(gw);
      setOriginal({ address: data.address || '', subnetMask: data.subnetMask || '', gateway: data.gateway || '' });
      setInfo(data.info || {});

      const isPending = !!data.pending;
      setPending(isPending);
      setRemaining(isPending ? data.remainingSeconds || 0 : 0);
    } catch (err) {
      console.log(err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  function buildNewUrl() {
    const protocol = window.location.protocol;
    const port = window.location.port;
    const portPart = port ? `:${port}` : '';
    return `${protocol}//${address}${portPart}`;
  }

  async function doSave() {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const rsp = await api.setIPv4(
        mode,
        mode === 'static' ? address.trim() : '',
        mode === 'static' ? subnetMask.trim() : '',
        mode === 'static' ? gateway.trim() : ''
      );
      if (rsp.code !== 0) {
        setError(rsp.msg || t('settings.network.ip.saveFailed'));
        return;
      }

      setOriginalMode(mode);
      setOriginal({ address: address.trim(), subnetMask: subnetMask.trim(), gateway: gateway.trim() });

      if (mode === 'static') {
        setMessage(t('settings.network.ip.savedReconnect', { url: buildNewUrl() }));
      } else {
        setMessage(t('settings.network.ip.savedDhcp'));
      }
    } catch (err) {
      // The connection is expected to drop while the interface re-configures.
      console.log(err);
      if (mode === 'static') {
        setMessage(t('settings.network.ip.savedReconnect', { url: buildNewUrl() }));
      } else {
        setMessage(t('settings.network.ip.savedDhcp'));
      }
    } finally {
      setIsSaving(false);
    }
  }

  function save() {
    if (isSaving) return;

    setMessage('');
    setError('');

    if (mode === 'static') {
      if (!isValidIPv4(address.trim())) {
        setError(t('settings.network.ip.invalidAddress'));
        return;
      }
      const prefix = maskToPrefix(subnetMask.trim());
      if (prefix === null) {
        setError(t('settings.network.ip.invalidMask'));
        return;
      }
      if (!isValidIPv4(gateway.trim())) {
        setError(t('settings.network.ip.invalidGateway'));
        return;
      }
      if (!sameSubnet(address.trim(), gateway.trim(), prefix)) {
        setError(t('settings.network.ip.gatewaySubnet'));
        return;
      }
    }

    Modal.confirm({
      title: t('settings.network.ip.confirmTitle'),
      icon: <TriangleAlertIcon size={20} className="mr-2 text-yellow-400" />,
      content:
        mode === 'static'
          ? t('settings.network.ip.confirmStatic', { url: buildNewUrl() })
          : t('settings.network.ip.confirmDhcp'),
      okText: t('settings.network.ip.confirmOk'),
      cancelText: t('settings.network.ip.confirmCancel'),
      okButtonProps: { danger: true },
      onOk: doSave
    });
  }

  const prefixValue = mode === 'static' ? maskToPrefix(subnetMask.trim()) : null;
  const addressInvalid = mode === 'static' && address.trim() !== '' && !isValidIPv4(address.trim());
  const maskInvalid = mode === 'static' && subnetMask.trim() !== '' && prefixValue === null;
  const gatewayInvalid = mode === 'static' && gateway.trim() !== '' && !isValidIPv4(gateway.trim());

  const hasChanges =
    mode !== originalMode ||
    (mode === 'static' &&
      (address.trim() !== original.address ||
        subnetMask.trim() !== original.subnetMask ||
        gateway.trim() !== original.gateway));

  const statusText = error || message || (hasChanges ? t('settings.network.ip.unsaved') : '');
  const statusColor = error ? 'text-red-400' : message ? 'text-green-400' : 'text-yellow-400/80';

  const description =
    mode === 'dhcp'
      ? t('settings.network.ip.dhcpDescription')
      : t('settings.network.ip.staticDescription');

  const panelTitle =
    mode === 'dhcp'
      ? t('settings.network.dns.networkDetails')
      : t('settings.network.ip.addressing');

  return (
    <div className="flex flex-col space-y-5">
      {/* Confirmation banner: a static change is on trial and must be confirmed */}
      {pending && (
        <div className="flex flex-col gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <TriangleAlertIcon size={18} className="mt-0.5 shrink-0 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-yellow-100">
                {t('settings.network.ip.confirmPendingTitle')}
              </span>
              <span className="text-xs leading-snug text-yellow-200/80">
                {t('settings.network.ip.confirmPendingText', { time: formatRemaining(remaining) })}
              </span>
            </div>
          </div>
          <Button
            type="primary"
            icon={<CheckIcon size={14} />}
            loading={confirming}
            onClick={confirmChange}
            className="shrink-0"
          >
            {t('settings.network.ip.confirmKeep')}
          </Button>
        </div>
      )}

      {/* Header row: title + segmented control */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.network.ip.title')}</span>
          <span className="text-xs text-neutral-500">{t('settings.network.ip.description')}</span>
        </div>

        <Segmented
          disabled={isLoading || isSaving}
          value={mode}
          onChange={(val) => {
            setMode(val as IPv4Mode);
            setMessage('');
            setError('');
          }}
          options={[
            { label: t('settings.network.ip.dhcp'), value: 'dhcp' },
            { label: t('settings.network.ip.static'), value: 'static' }
          ]}
        />
      </div>

      <div className="space-y-5">
        <Panel title={panelTitle} description={description}>
          {mode === 'static' ? (
            <div>
              <FieldRow
                label={t('settings.network.ip.ipAddress')}
                value={address}
                placeholder="192.168.0.100"
                invalid={addressInvalid}
                onChange={(v) => {
                  setAddress(v);
                  setMessage('');
                  setError('');
                }}
              />
              <FieldRow
                label={t('settings.network.ip.subnetMask')}
                value={subnetMask}
                placeholder="255.255.255.0"
                invalid={maskInvalid}
                onChange={(v) => {
                  setSubnetMask(v);
                  setMessage('');
                  setError('');
                }}
              />
              <FieldRow
                label={t('settings.network.ip.gateway')}
                value={gateway}
                placeholder="192.168.0.1"
                invalid={gatewayInvalid}
                onChange={(v) => {
                  setGateway(v);
                  setMessage('');
                  setError('');
                }}
                isLast
              />
            </div>
          ) : (
            <div>
              <InfoRow label={t('settings.network.dns.interface')} value={formatInterface(info)} />
              <InfoRow label={t('settings.network.ip.ipAddress')} value={info.address} />
              <InfoRow label={t('settings.network.ip.subnetMask')} value={info.subnetMask} />
              <InfoRow label={t('settings.network.dns.router')} value={info.gateway} isLast />
            </div>
          )}
        </Panel>

        {/* Lockout warning while editing a static address */}
        {mode === 'static' && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
            <TriangleAlertIcon size={16} className="mt-0.5 shrink-0 text-yellow-400" />
            <span className="text-xs leading-snug text-yellow-200/90">
              {t('settings.network.ip.warning')}
            </span>
          </div>
        )}
      </div>

      {/* Footer: status + save button */}
      {(hasChanges || statusText) && (
        <div className="flex items-center justify-between gap-4">
          <span className={`text-xs ${statusColor}`}>{statusText}</span>

          <Button
            type={hasChanges ? 'primary' : 'default'}
            icon={message ? <CheckIcon size={14} /> : undefined}
            loading={isSaving}
            disabled={
              isLoading ||
              !hasChanges ||
              (mode === 'static' && (addressInvalid || maskInvalid || gatewayInvalid))
            }
            onClick={save}
          >
            {t('settings.network.ip.save')}
          </Button>
        </div>
      )}
    </div>
  );
};
