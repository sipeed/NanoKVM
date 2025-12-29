import { useState } from 'react';
import { CheckOutlined, LockOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import { Head } from '@/components/head.tsx';

type State = '' | 'loading' | 'success' | 'failed' | 'denied';

export const Wifi = () => {
  const { t } = useTranslation();

  const [state, setState] = useState<State>('');

  async function connect(values: any) {
    if (!values.ssid || !values.password) return;

    if (state === 'loading') return;
    setState('loading');

    try {
      const rsp = await api.connectWifiNoAuth(values.ssid, values.password);

      switch (rsp?.code) {
        case 0:
          setState('success');
          return;
        case -1:
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

  return (
    <>
      <Head title={t('head.wifi')} />

      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Form
          style={{ minWidth: 300, maxWidth: 500 }}
          initialValues={{ remember: true }}
          onFinish={connect}
        >
          <div className="flex flex-col space-y-1 pb-5">
            <span className="text-center text-2xl font-semibold text-neutral-100">
              {t('wifi.title')}
            </span>
            <span className="text-center text-neutral-400">{t('wifi.description')}</span>
          </div>

          <Form.Item name="ssid">
            <Input prefix={<WifiOutlined />} placeholder="SSID" />
          </Form.Item>

          <Form.Item name="password">
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

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
