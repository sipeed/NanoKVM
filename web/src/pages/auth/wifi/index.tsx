import { useState } from 'react';
import { CheckOutlined, LockOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';

import { connectWifi } from '@/api/auth.ts';
import { Head } from '@/components/head.tsx';

type State = '' | 'loading' | 'success' | 'failed';

export const Wifi = () => {
  const [state, setState] = useState<State>('');

  function connect(values: any) {
    if (state === 'loading' || state === 'success') return;

    setState('loading');

    const ssid = values.ssid;
    const password = values.password;

    if (!ssid || !password) return;

    connectWifi(ssid, password)
      .then((rsp) => {
        console.log(rsp);
        setState(rsp.code === 0 ? 'success' : 'failed');
      })
      .catch(() => {
        setState('failed');
      });
  }

  return (
    <>
      <Head title="Wi-Fi" />

      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Form
          style={{ minWidth: 300, maxWidth: 500 }}
          initialValues={{ remember: true }}
          onFinish={connect}
        >
          <div className="flex flex-col space-y-1 pb-5">
            <span className="text-center text-2xl font-semibold text-neutral-100">Wi-Fi</span>
            <span className="text-center text-neutral-400">Configure Wi-Fi for NanoKVM-PCIe</span>
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
                Finished
              </Button>
            ) : (
              <Button
                className="w-full"
                htmlType="submit"
                type="primary"
                loading={state === 'loading'}
              >
                OK
              </Button>
            )}
          </Form.Item>
        </Form>

        <div className="flex h-6 justify-center px-10">
          {state === 'success' && (
            <span className="text-sm text-green-500">
              Please check the network status of NanoKVM and visit the new IP address.
            </span>
          )}

          {state === 'failed' && (
            <span className="text-sm text-red-500">Operation failed, please try again.</span>
          )}
        </div>
      </div>
    </>
  );
};
