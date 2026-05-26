import { useEffect, useState } from 'react';
import { LockOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Select, Switch } from 'antd';
import { WifiIcon, WifiPenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import type { WiFiSecurityMode } from '@/api/network.ts';

export const Wifi = () => {
  const { t } = useTranslation();

  const [isSupported, setIsSupported] = useState(false);
  const [isAPMode, setIsAPMode] = useState(false);
  const [connectedWiFi, setConnectedWifi] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<WiFiSecurityMode>('psk');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [identity, setIdentity] = useState('');
  const [eap, setEap] = useState('PEAP');
  const [phase2, setPhase2] = useState('auth=MSCHAPV2');
  const [anonymousIdentity, setAnonymousIdentity] = useState('');
  const [caCert, setCaCert] = useState('');
  const [domainSuffixMatch, setDomainSuffixMatch] = useState('');
  const [status, setStatus] = useState<'' | 'connecting' | 'disconnecting'>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getWiFi();
  }, []);

  async function getWiFi() {
    try {
      const rsp = await api.getWiFi();
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setIsSupported(!!rsp.data?.supported);
      setIsAPMode(!!rsp.data?.apMode);

      if (rsp.data?.connected && rsp.data?.ssid) {
        setConnectedWifi(rsp.data.ssid);
      } else {
        setConnectedWifi('');
      }
    } catch {
      /* empty */
    }
  }

  async function connect() {
    setMessage('');

    if (!ssid || !password || (mode === 'enterprise' && !identity)) return;

    if (status !== '') return;
    setStatus('connecting');

    try {
      const rsp = await api.connectWifi(ssid, password, {
        mode,
        identity,
        eap,
        phase2,
        anonymousIdentity,
        caCert,
        domainSuffixMatch
      });
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        setMessage(t('settings.network.wifi.failed'));
        getWiFi();
        return;
      }

      setConnectedWifi(ssid);
      setIsModalOpen(false);
    } catch (err) {
      console.log(err);
    } finally {
      setStatus('');
    }
  }

  async function disconnect(enable: boolean) {
    if (enable || status !== '') return;

    setStatus('disconnecting');

    try {
      const rsp = await api.disconnectWifi();
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setConnectedWifi('');
    } catch (err) {
      console.log(err);
    } finally {
      setStatus('');
    }
  }

  function openModal() {
    setMode('psk');
    setSsid('');
    setPassword('');
    setIdentity('');
    setEap('PEAP');
    setPhase2('auth=MSCHAPV2');
    setAnonymousIdentity('');
    setCaCert('');
    setDomainSuffixMatch('');
    setMessage('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (status !== '') return;
    setIsModalOpen(false);
  }

  if (!isSupported) {
    return <></>;
  }

  if (isAPMode) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.network.wifi.title')}</span>
          <span className="text-xs text-neutral-500">{t('settings.network.wifi.apMode')}</span>
        </div>

        <Button shape="round" size="small" disabled>
          <div className="flex items-center justify-center px-1.5">
            <WifiIcon size={16} />
          </div>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.network.wifi.title')}</span>
          <span className="text-xs text-neutral-500">
            {connectedWiFi ? connectedWiFi : t('settings.network.wifi.description')}
          </span>
        </div>

        <Button
          type={connectedWiFi ? 'primary' : 'default'}
          shape="round"
          size="small"
          onClick={openModal}
        >
          <div className="flex items-center justify-center px-1.5">
            <WifiIcon size={16} />
          </div>
        </Button>
      </div>

      <Modal
        closable={false}
        open={isModalOpen}
        centered={true}
        onOk={connect}
        onCancel={closeModal}
        okText={t('settings.network.wifi.joinBtn')}
        cancelText={t('settings.network.wifi.cancelBtn')}
        confirmLoading={status === 'connecting'}
      >
        {/* title */}
        <div className="flex items-center space-x-5">
          <div className="h-[64px] w-[64px]">
            <WifiPenIcon size={64} className="text-blue-400" />
          </div>

          {!connectedWiFi ? (
            <div className="flex flex-col">
              <span className="text-lg font-bold">{t('settings.network.wifi.connect')}</span>
              <span className="text-xs text-neutral-400">
                {t('settings.network.wifi.connectDesc1')}
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex w-[300px] justify-between rounded-lg bg-neutral-800">
                <div className="flex w-full justify-between p-3">
                  <span>{connectedWiFi}</span>
                  <Switch
                    value={!!connectedWiFi}
                    loading={status === 'disconnecting'}
                    onChange={disconnect}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* form */}
        <div className="flex flex-col items-center space-y-3 py-6">
          <Select
            value={mode}
            style={{ width: '300px' }}
            options={[
              { value: 'psk', label: 'Personal / WPA-PSK' },
              { value: 'enterprise', label: 'Enterprise / 802.1X' }
            ]}
            onChange={setMode}
          />
          <Input
            value={ssid}
            style={{ width: '300px' }}
            prefix={<WifiOutlined />}
            placeholder={t('settings.network.wifi.ssid')}
            onChange={(e) => setSsid(e.target.value)}
          />
          <Input.Password
            value={password}
            style={{ width: '300px' }}
            prefix={<LockOutlined />}
            placeholder={t('settings.network.wifi.password')}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === 'enterprise' && (
            <>
              <Input
                value={identity}
                style={{ width: '300px' }}
                placeholder="Identity / Username"
                onChange={(e) => setIdentity(e.target.value)}
              />
              <Select
                value={eap}
                style={{ width: '300px' }}
                options={[
                  { value: 'PEAP', label: 'EAP: PEAP' },
                  { value: 'TTLS', label: 'EAP: TTLS' },
                  { value: 'TLS', label: 'EAP: TLS' }
                ]}
                onChange={setEap}
              />
              <Input
                value={phase2}
                style={{ width: '300px' }}
                placeholder="Phase 2 auth"
                onChange={(e) => setPhase2(e.target.value)}
              />
              <Input
                value={anonymousIdentity}
                style={{ width: '300px' }}
                placeholder="Anonymous identity (optional)"
                onChange={(e) => setAnonymousIdentity(e.target.value)}
              />
              <Input
                value={caCert}
                style={{ width: '300px' }}
                placeholder="CA certificate path (optional)"
                onChange={(e) => setCaCert(e.target.value)}
              />
              <Input
                value={domainSuffixMatch}
                style={{ width: '300px' }}
                placeholder="Domain suffix match (optional)"
                onChange={(e) => setDomainSuffixMatch(e.target.value)}
              />
            </>
          )}

          {!!message && <span className="text-sm text-red-500">{message}</span>}
        </div>
      </Modal>
    </>
  );
};
