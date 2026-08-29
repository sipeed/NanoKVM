import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Segmented } from 'antd';
import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import type { EthernetConfig, EthernetMode } from '@/api/network.ts';

function isIPv4(value: string) {
  const parts = value.trim().split('.');
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
  );
}


export const Ethernet = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<EthernetConfig>({
    mode: 'dhcp',
    interface: 'eth0',
    address: '',
    subnetMask: '255.255.255.0',
    gateway: ''
  });
  const [original, setOriginal] = useState<EthernetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getEthernet = useCallback(async () => {
    setIsLoading(true);
    try {
      const rsp = await api.getEthernet();
      if (rsp.code !== 0) {
        setError(rsp.msg || t('settings.network.ethernet.loadFailed'));
        return;
      }
      const fetched = rsp.data as EthernetConfig;
      setConfig(fetched);
      setOriginal(fetched);
    } catch {
      setError(t('settings.network.ethernet.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void getEthernet();
  }, [getEthernet]);

  function update(fields: Partial<EthernetConfig>) {
    setMessage('');
    setError('');
    setConfig((current) => ({ ...current, ...fields }));
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(original);
  const invalidStatic =
    config.mode === 'static' &&
    (!isIPv4(config.address) || !isIPv4(config.gateway));

  async function save() {
    if (isSaving || invalidStatic) return;
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      const rsp = await api.setEthernet({
        mode: config.mode,
        address: config.mode === 'static' ? config.address.trim() : '',
        subnetMask: config.mode === 'static' ? config.subnetMask.trim() : '',
        gateway: config.mode === 'static' ? config.gateway.trim() : ''
      });
      if (rsp.code !== 0) {
        setError(rsp.msg || t('settings.network.ethernet.saveFailed'));
        return;
      }
      setOriginal(config);
      setMessage(
        config.mode === 'static'
          ? t('settings.network.ethernet.savedStatic', { address: config.address })
          : t('settings.network.ethernet.savedDhcp')
      );
    } catch {
      setError(t('settings.network.ethernet.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.network.ethernet.title')}</span>
          <span className="text-xs text-neutral-500">{t('settings.network.ethernet.description')}</span>
        </div>
        <Segmented
          disabled={isLoading || isSaving}
          value={config.mode}
          onChange={(mode) => update({ mode: mode as EthernetMode })}
          options={[
            { label: t('settings.network.ethernet.dhcp'), value: 'dhcp' },
            { label: t('settings.network.ethernet.static'), value: 'static' }
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-neutral-800/50">
        <div className="px-4 pb-1.5 pt-3">
          <div className="font-semibold text-neutral-100">{t('settings.network.ethernet.ipv4')}</div>
          <div className="mt-0.5 text-xs leading-snug text-neutral-500">
            {config.mode === 'dhcp'
              ? t('settings.network.ethernet.dhcpDescription')
              : t('settings.network.ethernet.staticDescription')}
          </div>
        </div>

        {config.mode === 'static' && (
          <div className="space-y-3 px-4 pb-4 pt-2">
            <Input
              value={config.address}
              status={config.address && !isIPv4(config.address) ? 'error' : undefined}
              placeholder={t('settings.network.ethernet.addressPlaceholder')}
              addonBefore={t('settings.network.ethernet.ipAddress')}
              onChange={(event) => update({ address: event.target.value })}
            />
            <Input
              value={config.subnetMask}
              placeholder={t('settings.network.ethernet.subnetMaskPlaceholder')}
              addonBefore={t('settings.network.ethernet.subnetMask')}
              onChange={(event) => update({ subnetMask: event.target.value })}
            />
            <Input
              value={config.gateway}
              status={config.gateway && !isIPv4(config.gateway) ? 'error' : undefined}
              placeholder={t('settings.network.ethernet.gatewayPlaceholder')}
              addonBefore={t('settings.network.ethernet.gateway')}
              onChange={(event) => update({ gateway: event.target.value })}
            />
            {invalidStatic && <div className="text-xs text-red-400">{t('settings.network.ethernet.invalid')}</div>}
          </div>
        )}
      </div>

      {(hasChanges || message || error) && (
        <div className="flex items-center justify-between gap-4">
          <span className={`text-xs ${error ? 'text-red-400' : message ? 'text-green-400' : 'text-yellow-400/80'}`}>
            {error || message || t('settings.network.ethernet.unsaved')}
          </span>
          <Button
            type={hasChanges ? 'primary' : 'default'}
            icon={message ? <CheckIcon size={14} /> : undefined}
            loading={isSaving}
            disabled={isLoading || !hasChanges || invalidStatic}
            onClick={save}
          >
            {t('settings.network.ethernet.save')}
          </Button>
        </div>
      )}
    </div>
  );
};
