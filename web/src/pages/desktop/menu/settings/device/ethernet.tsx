import { useEffect, useState } from 'react';
import { Button, Input, Modal, Switch, message } from 'antd';
import { NetworkIcon, SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import { EthernetConfig } from '@/api/network.ts';

export const Ethernet = () => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentConfig, setCurrentConfig] = useState<EthernetConfig>({
    dhcp: true,
    ip: '',
    netmask: '255.255.255.0',
    gateway: '',
    dns1: '',
    dns2: ''
  });

  const [config, setConfig] = useState<EthernetConfig>({
    dhcp: true,
    ip: '',
    netmask: '255.255.255.0',
    gateway: '',
    dns1: '',
    dns2: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setIsLoading(true);
    try {
      const rsp = await api.getEthernetConfig();
      if (rsp.code === 0 && rsp.data) {
        setCurrentConfig(rsp.data.current);
        setConfig(rsp.data.config);
      }
    } catch (err) {
      console.error('Failed to load ethernet config:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveConfig() {
    if (!config.dhcp) {
      if (!config.ip || !isValidIP(config.ip)) {
        message.error(t('settings.device.ethernet.invalidIp'));
        return;
      }
      if (!config.netmask || !isValidNetmask(config.netmask)) {
        message.error(t('settings.device.ethernet.invalidNetmask'));
        return;
      }
      if (config.gateway && !isValidIP(config.gateway)) {
        message.error(t('settings.device.ethernet.invalidGateway'));
        return;
      }
      if (config.dns1 && !isValidIP(config.dns1)) {
        message.error(t('settings.device.ethernet.invalidDns'));
        return;
      }
      if (config.dns2 && !isValidIP(config.dns2)) {
        message.error(t('settings.device.ethernet.invalidDns'));
        return;
      }
    }

    setIsSaving(true);
    try {
      const rsp = await api.setEthernetConfig(config);
      if (rsp.code === 0) {
        message.success(t('settings.device.ethernet.success'));
        setIsModalOpen(false);
        setTimeout(() => {
          loadConfig();
        }, 3000);
      } else {
        message.error(rsp.msg || t('settings.device.ethernet.failed'));
      }
    } catch (err) {
      console.error('Failed to save ethernet config:', err);
      message.error(t('settings.device.ethernet.failed'));
    } finally {
      setIsSaving(false);
    }
  }

  function isValidIP(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
    });
  }

  function isValidNetmask(netmask: string): boolean {
    if (!isValidIP(netmask)) return false;
    const parts = netmask.split('.').map((p) => parseInt(p, 10));
    const bits = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
    const inverted = ~bits >>> 0;
    return (inverted & (inverted + 1)) === 0;
  }

  function openModal() {
    loadConfig();
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;
    setIsModalOpen(false);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.device.ethernet.title')}</span>
          <span className="text-xs text-neutral-500">
            {currentConfig.dhcp
              ? 'DHCP'
              : currentConfig.ip
                ? `${currentConfig.ip}`
                : t('settings.device.ethernet.notConfigured')}
          </span>
        </div>

        <Button shape="round" size="small" onClick={openModal} loading={isLoading}>
          <div className="flex items-center justify-center px-1.5">
            <SettingsIcon size={16} />
          </div>
        </Button>
      </div>

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <NetworkIcon size={20} />
            <span>{t('settings.device.ethernet.title')}</span>
          </div>
        }
        open={isModalOpen}
        onOk={saveConfig}
        onCancel={closeModal}
        okText={t('settings.device.ethernet.apply')}
        cancelText={t('settings.device.ethernet.cancel')}
        confirmLoading={isSaving}
        centered={true}
        width={400}
      >
        <div className="flex flex-col space-y-4 py-4">
          {/* DHCP Switch */}
          <div className="flex items-center justify-between">
            <span>{t('settings.device.ethernet.dhcp')}</span>
            <Switch
              checked={config.dhcp}
              onChange={(checked) => setConfig({ ...config, dhcp: checked })}
            />
          </div>

          {!config.dhcp && (
            <>
              {/* Warning */}
              <div className="rounded bg-yellow-900/30 p-2 text-xs text-yellow-500">
                {t('settings.device.ethernet.warning')}
              </div>

              {/* IP Address */}
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-neutral-400">
                  {t('settings.device.ethernet.ip')}
                </span>
                <Input
                  value={config.ip}
                  placeholder="192.168.1.100"
                  onChange={(e) => setConfig({ ...config, ip: e.target.value })}
                />
              </div>

              {/* Netmask */}
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-neutral-400">
                  {t('settings.device.ethernet.netmask')}
                </span>
                <Input
                  value={config.netmask}
                  placeholder="255.255.255.0"
                  onChange={(e) => setConfig({ ...config, netmask: e.target.value })}
                />
              </div>

              {/* Gateway */}
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-neutral-400">
                  {t('settings.device.ethernet.gateway')}
                </span>
                <Input
                  value={config.gateway}
                  placeholder="192.168.1.1"
                  onChange={(e) => setConfig({ ...config, gateway: e.target.value })}
                />
              </div>

              {/* DNS1 */}
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-neutral-400">
                  {t('settings.device.ethernet.dns1')}
                </span>
                <Input
                  value={config.dns1}
                  placeholder="8.8.8.8"
                  onChange={(e) => setConfig({ ...config, dns1: e.target.value })}
                />
              </div>

              {/* DNS2 */}
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-neutral-400">
                  {t('settings.device.ethernet.dns2')}
                </span>
                <Input
                  value={config.dns2}
                  placeholder="8.8.4.4"
                  onChange={(e) => setConfig({ ...config, dns2: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Current IP Info */}
          {currentConfig.ip && (
            <div className="rounded bg-neutral-800 p-3 text-sm">
              <div className="mb-1 text-neutral-400">{t('settings.device.ethernet.current')}:</div>
              <div className="flex flex-col space-y-1 text-xs">
                <span>IP: {currentConfig.ip}</span>
                {currentConfig.gateway && <span>Gateway: {currentConfig.gateway}</span>}
                {currentConfig.dns1 && <span>DNS: {currentConfig.dns1}</span>}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
