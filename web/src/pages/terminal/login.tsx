import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';

import { encrypt } from '@/lib/encrypt.ts';
import { Head } from '@/components/head.tsx';

type LoginProps = {
  setToken: (token: string) => void;
};

export const Login = ({ setToken }: LoginProps) => {
  const { t } = useTranslation();

  function login(values: any) {
    const username = values.username;
    const password = encrypt(values.password);

    setToken(`u=${username}&t=${password}`);
  }

  return (
    <>
      <Head title={t('head.login')} />

      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-neutral-100">SSH to NanoKVM</h2>

        <Form
          style={{ minWidth: 300, maxWidth: 500 }}
          initialValues={{ username: 'root' }}
          onFinish={login}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('auth.noEmptyUsername'), min: 1 }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('auth.placeholderUsername')} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth.noEmptyPassword'), min: 1 }]}
          >
            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder={t('auth.placeholderPassword')}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              {t('auth.ok')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};
