import { useEffect, useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as api from '@/api/auth.ts';
import { existToken, setToken } from '@/lib/cookie.ts';
import { encrypt } from '@/lib/encrypt.ts';
import { Head } from '@/components/head.tsx';

import { Tips } from './tips.tsx';

export const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (existToken()) {
      navigate('/', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (msg) {
      setTimeout(() => setMsg(''), 3000);
    }
  }, [msg]);

  function login(values: any) {
    const username = values.username;
    const password = encrypt(values.password);

    api
      .login(username, password)
      .then((rsp: any) => {
        if (rsp.code !== 0) {
          if (rsp.code === -3) {
            setMsg(t('auth.noAccount'));
          } else if (rsp.code === -4) {
            setMsg(t('auth.invalidUser'));
          } else {
            setMsg(t('auth.error'));
          }

          return;
        }

        setMsg('');
        setToken(rsp.data.token);

        navigate('/', { replace: true });
        window.location.reload();
      })
      .catch(() => {
        setMsg(t('auth.error'));
      });
  }

  return (
    <>
      <Head title={t('head.login')} />

      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-neutral-100">{t('auth.login')}</h2>

        <Form
          style={{ minWidth: 300, maxWidth: 500 }}
          initialValues={{ remember: true }}
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

          <div className="text-red-500">{msg}</div>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              {t('auth.loginButtonText')}
            </Button>
          </Form.Item>

          <div className="flex justify-end pb-4 text-sm">
            <Tips />
          </div>
        </Form>
      </div>
    </>
  );
};
