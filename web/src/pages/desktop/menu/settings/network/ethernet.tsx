import { useEffect, useState } from 'react';
import { ApiOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Segmented, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import type { EthernetIPMode, EthernetSecurityMode } from '@/api/network.ts';

type EAPMethod = 'PEAP' | 'TTLS' | 'TLS' | 'PWD' | 'LEAP';

const getDefaultPhase2 = (eap: EAPMethod) => {
  if (eap === 'PEAP' || eap === 'TTLS') return 'auth=MSCHAPV2';
  return '';
};

const getEapOptions = (t: (key: string) => string) => [
  { value: 'PEAP', label: t('settings.network.wifi.eapPeap') },
  { value: 'TTLS', label: t('settings.network.wifi.eapTtls') },
  { value: 'TLS', label: t('settings.network.wifi.eapTls') },
  { value: 'PWD', label: t('settings.network.wifi.eapPwd') },
  { value: 'LEAP', label: t('settings.network.wifi.eapLeap') }
];

const getInnerAuthOptions = (eap: EAPMethod, t: (key: string) => string) => {
  const peapInnerAuthOptions = [
    { value: 'auth=MSCHAPV2', label: t('settings.network.wifi.authMschapv2') },
    { value: 'auth=GTC', label: t('settings.network.wifi.authGtc') },
    { value: 'auth=MD5', label: t('settings.network.wifi.authMd5') }
  ];
  const ttlsInnerAuthOptions = [
    { value: 'auth=MSCHAPV2', label: t('settings.network.wifi.authMschapv2') },
    { value: 'auth=MSCHAP', label: t('settings.network.wifi.authMschap') },
    { value: 'auth=CHAP', label: t('settings.network.wifi.authChap') },
    { value: 'auth=PAP', label: t('settings.network.wifi.authPap') }
  ];
  if (eap === 'PEAP') return peapInnerAuthOptions;
  if (eap === 'TTLS') return ttlsInnerAuthOptions;
  return [];
};

const usesPassword = (eap: EAPMethod) => eap !== 'TLS';
const usesInnerAuth = (eap: EAPMethod) => eap === 'PEAP' || eap === 'TTLS';

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

function isValidSubnetMask(value: string) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;

  const bytes = parts.map((part) => {
    if (!/^\d+$/.test(part)) return NaN;
    const number = Number(part);
    if (number < 0 || number > 255) return NaN;
    return number;
  });
  if (bytes.some(Number.isNaN)) return false;

  const mask = bytes
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join('');
  if (!/^1*0*$/.test(mask)) return false;

  const ones = mask.indexOf('0') === -1 ? 32 : mask.indexOf('0');
  return ones >= 1 && ones <= 32;
}

export const Ethernet = () => {
  const { t } = useTranslation();

  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [iface, setIface] = useState('eth0');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<EthernetSecurityMode>('off');
  const [ipMode, setIPMode] = useState<EthernetIPMode>('dhcp');
  const [address, setAddress] = useState('');
  const [subnetMask, setSubnetMask] = useState('');
  const [gateway, setGateway] = useState('');
  const [password, setPassword] = useState('');
  const [passwordSet, setPasswordSet] = useState(false);
  const [identity, setIdentity] = useState('');
  const [eap, setEap] = useState<EAPMethod>('PEAP');
  const [phase2, setPhase2] = useState('auth=MSCHAPV2');
  const [anonymousIdentity, setAnonymousIdentity] = useState('');
  const [caCert, setCaCert] = useState('');
  const [clientCert, setClientCert] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyPasswd, setPrivateKeyPasswd] = useState('');
  const [privateKeyPasswdSet, setPrivateKeyPasswdSet] = useState(false);
  const [domainSuffixMatch, setDomainSuffixMatch] = useState('');
  const [status, setStatus] = useState<'' | 'saving'>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getEthernet();
  }, []);

  async function getEthernet() {
    try {
      const rsp = await api.getEthernet();
      if (rsp.code !== 0) return;

      setConfigured(!!rsp.data?.configured);
      setConnected(!!rsp.data?.connected);
      setIface(rsp.data?.interface || 'eth0');
      setMode(rsp.data?.mode === 'enterprise' ? 'enterprise' : 'off');
      setIPMode(rsp.data?.ipMode === 'manual' ? 'manual' : 'dhcp');
      setAddress(rsp.data?.address || '');
      setSubnetMask(rsp.data?.subnetMask || '');
      setGateway(rsp.data?.gateway || '');
      setPassword('');
      setPasswordSet(!!rsp.data?.passwordSet);
      setIdentity(rsp.data?.identity || '');
      setEap((rsp.data?.eap as EAPMethod) || 'PEAP');
      setPhase2(rsp.data?.phase2 || 'auth=MSCHAPV2');
      setAnonymousIdentity(rsp.data?.anonymousIdentity || '');
      setCaCert(rsp.data?.caCert || '');
      setClientCert(rsp.data?.clientCert || '');
      setPrivateKey(rsp.data?.privateKey || '');
      setPrivateKeyPasswd('');
      setPrivateKeyPasswdSet(!!rsp.data?.privateKeyPasswdSet);
      setDomainSuffixMatch(rsp.data?.domainSuffixMatch || '');
    } catch {
      /* empty */
    }
  }

  async function save() {
    setMessage('');

    if (mode === 'enterprise' && !identity) return;
    if (mode === 'enterprise' && usesPassword(eap) && !password && !passwordSet) return;
    if (mode === 'enterprise' && eap === 'TLS' && (!clientCert || !privateKey)) return;
    if (ipMode === 'manual' && !isValidIPv4(address)) return;
    if (ipMode === 'manual' && !subnetMask) return;
    if (ipMode === 'manual' && !isValidSubnetMask(subnetMask)) return;
    if (ipMode === 'manual' && gateway && !isValidIPv4(gateway)) return;
    if (status !== '') return;

    setStatus('saving');

    try {
      const rsp = await api.setEthernet({
        mode,
        ipMode,
        address,
        subnetMask,
        gateway,
        password,
        identity,
        eap,
        phase2,
        anonymousIdentity,
        caCert,
        clientCert,
        privateKey,
        privateKeyPasswd,
        domainSuffixMatch
      });
      if (rsp.code !== 0) {
        setMessage(t('settings.network.ethernet.failed'));
        await getEthernet();
        return;
      }

      setConfigured(mode === 'enterprise');
      setIsModalOpen(false);
      await getEthernet();
    } finally {
      setStatus('');
    }
  }

  function openModal() {
    setPassword('');
    setPrivateKeyPasswd('');
    setMessage('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (status !== '') return;
    setIsModalOpen(false);
  }

  function changeEap(value: EAPMethod) {
    setEap(value);
    setPhase2(getDefaultPhase2(value));
    if (value === 'TLS') {
      setPassword('');
    }
  }

  const statusText = configured
    ? connected
      ? t('settings.network.ethernet.active')
      : t('settings.network.ethernet.inactive')
    : t('settings.network.ethernet.description');
  const enterpriseEnabled = mode === 'enterprise';

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.network.ethernet.title')}</span>
          <span className="text-xs text-neutral-500">{statusText}</span>
        </div>

        <Button
          type="default"
          shape="round"
          size="small"
          onClick={openModal}
        >
          <div className={`flex items-center justify-center px-1.5 ${connected ? 'text-blue-400' : ''}`}>
            <ApiOutlined />
          </div>
        </Button>
      </div>

      <Modal
        closable={false}
        open={isModalOpen}
        centered={true}
        onOk={save}
        onCancel={closeModal}
        okText={t('settings.network.wifi.joinBtn')}
        cancelText={t('settings.network.wifi.cancelBtn')}
        confirmLoading={status === 'saving'}
      >
        <div className="flex items-center space-x-5">
          <div className="flex h-[64px] w-[64px] items-center justify-center text-[56px] text-blue-400">
            <ApiOutlined />
          </div>

          <div className="flex flex-col">
            <span className="text-lg font-bold">{t('settings.network.ethernet.connect')}</span>
            <span className="text-xs text-neutral-400">
              {t('settings.network.ethernet.connectDesc', { iface })}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4 py-6">
          <div className="flex w-[300px] flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{t('settings.network.ethernet.ipConfig')}</span>
              <span className="text-xs text-neutral-500">
                {t('settings.network.ethernet.ipConfigDescription')}
              </span>
            </div>
            <Segmented
              block
              value={ipMode}
              options={[
                { label: t('settings.network.dns.dhcp'), value: 'dhcp' },
                { label: t('settings.network.dns.manual'), value: 'manual' }
              ]}
              onChange={(value) => setIPMode(value as EthernetIPMode)}
            />

            {ipMode === 'manual' && (
              <div className="space-y-3 pt-1">
                <Input
                  value={address}
                  placeholder={t('settings.network.ethernet.addressPlaceholder')}
                  onChange={(e) => setAddress(e.target.value)}
                  status={address !== '' && !isValidIPv4(address) ? 'error' : undefined}
                />
                <Input
                  value={subnetMask}
                  placeholder="255.255.255.0"
                  onChange={(e) => setSubnetMask(e.target.value)}
                  status={subnetMask !== '' && !isValidSubnetMask(subnetMask) ? 'error' : undefined}
                />
                <Input
                  value={gateway}
                  placeholder={t('settings.network.ethernet.gatewayPlaceholder')}
                  onChange={(e) => setGateway(e.target.value)}
                  status={gateway !== '' && !isValidIPv4(gateway) ? 'error' : undefined}
                />
              </div>
            )}
          </div>

          <div className="h-px w-[300px] bg-neutral-800/80" />

          <div className="flex w-[300px] items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{t('settings.network.ethernet.authTitle')}</span>
              <span className="text-xs text-neutral-500">
                {t('settings.network.ethernet.authDescription')}
              </span>
            </div>
            <Switch
              checked={enterpriseEnabled}
              loading={status === 'saving'}
              onChange={(enabled) => {
                if (!enabled) {
                  setMode('off');
                  return;
                }
                setMode('enterprise');
                if (!identity) setIdentity('');
                if (!eap) setEap('PEAP');
                if (!phase2) setPhase2('auth=MSCHAPV2');
              }}
            />
          </div>

          {enterpriseEnabled && (
            <>
              <Input
                value={identity}
                style={{ width: '300px' }}
                prefix={<UserOutlined />}
                placeholder={t('settings.network.wifi.identity')}
                onChange={(e) => setIdentity(e.target.value)}
              />
              {usesPassword(eap) && (
                <Input.Password
                  value={password}
                  style={{ width: '300px' }}
                  prefix={<LockOutlined />}
                  placeholder={
                    passwordSet
                      ? t('settings.network.ethernet.passwordUnchanged')
                      : t('settings.network.wifi.password')
                  }
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
              <Select
                value={eap}
                style={{ width: '300px' }}
                options={getEapOptions(t)}
                placeholder={t('settings.network.wifi.authentication')}
                onChange={changeEap}
              />
              {usesInnerAuth(eap) && (
                <Select
                  value={phase2}
                  style={{ width: '300px' }}
                  options={getInnerAuthOptions(eap, t)}
                  placeholder={t('settings.network.wifi.innerAuthentication')}
                  onChange={setPhase2}
                />
              )}
              <Input
                value={anonymousIdentity}
                style={{ width: '300px' }}
                placeholder={t('settings.network.wifi.anonymousIdentity')}
                onChange={(e) => setAnonymousIdentity(e.target.value)}
              />
              {eap === 'TLS' && (
                <>
                  <Input
                    value={clientCert}
                    style={{ width: '300px' }}
                    placeholder={t('settings.network.wifi.clientCert')}
                    onChange={(e) => setClientCert(e.target.value)}
                  />
                  <Input
                    value={privateKey}
                    style={{ width: '300px' }}
                    placeholder={t('settings.network.wifi.privateKey')}
                    onChange={(e) => setPrivateKey(e.target.value)}
                  />
                  <Input.Password
                    value={privateKeyPasswd}
                    style={{ width: '300px' }}
                    placeholder={
                      privateKeyPasswdSet
                        ? t('settings.network.ethernet.privateKeyPasswdUnchanged')
                        : t('settings.network.wifi.privateKeyPasswd')
                    }
                    onChange={(e) => setPrivateKeyPasswd(e.target.value)}
                  />
                </>
              )}
              <Input
                value={caCert}
                style={{ width: '300px' }}
                placeholder={t('settings.network.wifi.caCert')}
                onChange={(e) => setCaCert(e.target.value)}
              />
              <Input
                value={domainSuffixMatch}
                style={{ width: '300px' }}
                placeholder={t('settings.network.wifi.domainSuffixMatch')}
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
