import { useEffect, useState } from 'react';
import { CheckOutlined, KeyOutlined, LockOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import * as api from '@/api/network.ts';
import { Head } from '@/components/head.tsx';

type State = '' | 'loading' | 'success' | 'failed' | 'denied';
type VerifyState = '' | 'failed' | 'denied';

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
    if (!values.ssid || !values.password) return;
    if (values.mode === 'enterprise' && !values.identity) return;

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
                { value: 'psk', label: 'Personal / WPA-PSK' },
                { value: 'enterprise', label: 'Enterprise / 802.1X' }
              ]}
            />
          </Form.Item>

          <Form.Item name="ssid">
            <Input prefix={<WifiOutlined />} placeholder="SSID" />
          </Form.Item>

          <Form.Item name="password">
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          {mode === 'enterprise' && (
            <>
              <Form.Item name="identity">
                <Input placeholder="Identity / Username" />
              </Form.Item>

              <Form.Item name="eap">
                <Select
                  options={[
                    { value: 'PEAP', label: 'EAP: PEAP' },
                    { value: 'TTLS', label: 'EAP: TTLS' },
                    { value: 'TLS', label: 'EAP: TLS' }
                  ]}
                />
              </Form.Item>

              <Form.Item name="phase2">
                <Input placeholder="Phase 2 auth" />
              </Form.Item>

              <Form.Item name="anonymousIdentity">
                <Input placeholder="Anonymous identity (optional)" />
              </Form.Item>

              <Form.Item name="caCert">
                <Input placeholder="CA certificate path (optional)" />
              </Form.Item>

              <Form.Item name="domainSuffixMatch">
                <Input placeholder="Domain suffix match (optional)" />
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
