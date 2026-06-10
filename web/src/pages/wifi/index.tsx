import { useEffect, useState } from 'react';
import { CheckOutlined, KeyOutlined, LockOutlined, UserOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import * as api from '@/api/network.ts';
import { Head } from '@/components/head.tsx';

type State = '' | 'loading' | 'success' | 'failed' | 'denied';
type VerifyState = '' | 'failed' | 'denied';
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

export const Wifi = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<State>('');
  const [apPassword, setApPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('');
  const [form] = Form.useForm();
  const mode = Form.useWatch('mode', form);
  const eap = (Form.useWatch('eap', form) || 'PEAP') as EAPMethod;

  useEffect(() => {
    const pass = searchParams.get('p') || searchParams.get('P');
    if (pass) {
      verifyPassword(pass);
    }
  }, []);

  async function verifyPassword(password: string) {
    if (verifying) return;
    setVerifying(true);
    setVerifyState('');

    try {
      const rsp = await api.verifyApLogin(password);
      if (rsp?.code === 0) {
        setApPassword(password);
        setIsAuthenticated(true);
      } else {
        setVerifyState(rsp?.code === -1 ? 'denied' : 'failed');
      }
    } catch (err) {
      console.error(err);
      setVerifyState('failed');
    }
    setVerifying(false);
  }

  async function onVerifyFinish(values: any) {
    if (!values.apPassword) return;
    await verifyPassword(values.apPassword);
  }

  async function connect(values: any) {
    if (!values.ssid) return;
    if ((values.mode || 'psk') === 'psk' && !values.password) return;
    if (values.mode === 'enterprise' && !values.identity) return;
    if (values.mode === 'enterprise' && usesPassword(values.eap || 'PEAP') && !values.password)
      return;
    if (
      values.mode === 'enterprise' &&
      values.eap === 'TLS' &&
      (!values.clientCert || !values.privateKey)
    )
      return;

    if (state === 'loading') return;
    setState('loading');

    try {
      const rsp = await api.connectWifiNoAuth(values.ssid, values.password, apPassword, {
        mode: values.mode || 'psk',
        identity: values.identity,
        eap: values.eap,
        phase2: values.phase2,
        anonymousIdentity: values.anonymousIdentity,
        caCert: values.caCert,
        clientCert: values.clientCert,
        privateKey: values.privateKey,
        privateKeyPasswd: values.privateKeyPasswd,
        domainSuffixMatch: values.domainSuffixMatch
      });

      switch (rsp?.code) {
        case 0:
          setState('success');
          return;
        case -1:
        case -4:
          setState('denied');
          return;
        case -2:
        case -3:
          setState('failed');
          return;
      }
    } catch (err) {
      console.log(err);
    }

    setState('success');
  }

  if (!isAuthenticated) {
    return (
      <>
        <Head title={t('head.wifi')} />

        <div className="flex h-screen w-screen flex-col items-center justify-center">
          <Form
            style={{ minWidth: 300, maxWidth: 500 }}
            initialValues={{ remember: true }}
            onFinish={onVerifyFinish}
          >
            <div className="flex flex-col space-y-1 pb-5">
              <span className="text-center text-2xl font-semibold text-red-500">
                {t('wifi.ap.authTitle')}
              </span>
              <span className="text-center text-neutral-400">{t('wifi.ap.authDescription')}</span>
            </div>

            <Form.Item name="apPassword">
              <Input.Password prefix={<KeyOutlined />} placeholder={t('wifi.ap.passPlaceholder')} />
            </Form.Item>

            <Form.Item>
              <Button className="w-full" htmlType="submit" type="primary" loading={verifying}>
                {t('wifi.ap.verifyBtn')}
              </Button>
            </Form.Item>
          </Form>

          <div className="flex max-w-[500px] justify-center px-5 pt-3 md:px-10">
            {verifyState === 'failed' && (
              <span className="text-sm text-red-500">{t('wifi.ap.authFailed')}</span>
            )}
            {verifyState === 'denied' && (
              <span className="text-sm text-red-500">{t('wifi.invalidMode')}</span>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title={t('head.wifi')} />

      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Form
          form={form}
          style={{ minWidth: 300, maxWidth: 500 }}
          initialValues={{ remember: true, mode: 'psk', eap: 'PEAP', phase2: 'auth=MSCHAPV2' }}
          onFinish={connect}
        >
          <div className="flex flex-col space-y-1 pb-5">
            <span className="text-center text-2xl font-semibold text-neutral-100">
              {t('wifi.title')}
            </span>
            <span className="text-center text-neutral-400">{t('wifi.description')}</span>
          </div>

          <Form.Item name="mode">
            <Select
              options={[
                { value: 'psk', label: t('settings.network.wifi.personal') },
                { value: 'enterprise', label: t('settings.network.wifi.enterprise') }
              ]}
            />
          </Form.Item>

          <Form.Item name="ssid">
            <Input prefix={<WifiOutlined />} placeholder="SSID" />
          </Form.Item>

          {mode !== 'enterprise' && (
            <Form.Item name="password">
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('settings.network.wifi.password')}
              />
            </Form.Item>
          )}

          {mode === 'enterprise' && (
            <>
              <Form.Item name="identity">
                <Input prefix={<UserOutlined />} placeholder={t('settings.network.wifi.identity')} />
              </Form.Item>

              {usesPassword(eap) && (
                <Form.Item name="password">
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder={t('settings.network.wifi.password')}
                  />
                </Form.Item>
              )}

              <Form.Item name="eap">
                <Select
                  options={getEapOptions(t)}
                  placeholder={t('settings.network.wifi.authentication')}
                  onChange={(value: EAPMethod) => {
                    form.setFieldValue('phase2', getDefaultPhase2(value));
                    if (value === 'TLS') {
                      form.setFieldValue('password', '');
                    }
                  }}
                />
              </Form.Item>

              {usesInnerAuth(eap) && (
                <Form.Item name="phase2">
                  <Select
                    options={getInnerAuthOptions(eap, t)}
                    placeholder={t('settings.network.wifi.innerAuthentication')}
                  />
                </Form.Item>
              )}

              <Form.Item name="anonymousIdentity">
                <Input placeholder={t('settings.network.wifi.anonymousIdentity')} />
              </Form.Item>

              <Form.Item name="caCert">
                <Input placeholder={t('settings.network.wifi.caCert')} />
              </Form.Item>

              {eap === 'TLS' && (
                <>
                  <Form.Item name="clientCert">
                    <Input placeholder={t('settings.network.wifi.clientCert')} />
                  </Form.Item>

                  <Form.Item name="privateKey">
                    <Input placeholder={t('settings.network.wifi.privateKey')} />
                  </Form.Item>

                  <Form.Item name="privateKeyPasswd">
                    <Input.Password placeholder={t('settings.network.wifi.privateKeyPasswd')} />
                  </Form.Item>
                </>
              )}

              <Form.Item name="domainSuffixMatch">
                <Input placeholder={t('settings.network.wifi.domainSuffixMatch')} />
              </Form.Item>
            </>
          )}

          <Form.Item>
            {state === 'success' ? (
              <Button className="w-full" type="primary" icon={<CheckOutlined />}>
                {t('wifi.finishBtn')}
              </Button>
            ) : (
              <Button
                className="w-full"
                htmlType="submit"
                type="primary"
                loading={state === 'loading'}
              >
                {t('wifi.confirmBtn')}
              </Button>
            )}
          </Form.Item>
        </Form>

        <div className="flex max-w-[500px] justify-center px-5 pt-3 md:px-10">
          {state === 'success' && (
            <span className="text-sm text-green-500">{t('wifi.success')}</span>
          )}

          {state === 'failed' && <span className="text-sm text-red-500">{t('wifi.failed')} </span>}
          {state === 'denied' && (
            <div className="flex flex-col items-center space-y-5">
              <span className="text-sm text-red-500">{t('wifi.invalidMode')} </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
