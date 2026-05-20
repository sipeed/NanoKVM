import { ReactElement, useEffect, useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as api from '@/api/auth.ts';
import { existToken, setToken } from '@/lib/cookie.ts';
import { encrypt } from '@/lib/encrypt.ts';
import { Head } from '@/components/head.tsx';

import { Tips } from './tips.tsx';

const REMEMBER_KEY = 'nano-kvm-remember';

interface SavedCredentials {
  username: string;
  password: string;
  autoLogin: boolean;
}

export const Login = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [isLoading, setIsloading] = useState(false);
  const [msg, setMsg] = useState('');
  const [rememberChecked, setRememberChecked] = useState(false);

  useEffect(() => {
    if (existToken()) {
      navigate('/', { replace: true });
      return;
    }

    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        const creds: SavedCredentials = JSON.parse(saved);
        form.setFieldsValue({
          username: creds.username,
          password: creds.password,
          remember: true,
          autoLogin: creds.autoLogin
        });
        setRememberChecked(true);
        if (creds.autoLogin) {
          doLogin({ username: creds.username, password: creds.password, remember: true, autoLogin: true });
        }
      }
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, []);

  useEffect(() => {
    if (msg) {
      setTimeout(() => setMsg(''), 3000);
    }
  }, [msg]);

  function doLogin(values: any) {
    if (isLoading) return;
    setIsloading(true);

    const username = values.username;
    const password = encrypt(values.password);

    api
      .login(username, password)
      .then((rsp: any) => {
        if (rsp.code !== 0) {
          let errorMsg = t('auth.error');
          if (rsp.code === -2) errorMsg = t('auth.invalidUser');
          else if (rsp.code === -5) errorMsg = t('auth.locked');
          else if (rsp.code === -4) errorMsg = t('auth.globalLocked');

          setMsg(errorMsg);
          return;
        }

        if (values.remember) {
          localStorage.setItem(
            REMEMBER_KEY,
            JSON.stringify({
              username: values.username,
              password: values.password,
              autoLogin: values.autoLogin || false
            } as SavedCredentials)
          );
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        setMsg('');
        setToken(rsp.data.token);

        navigate('/', { replace: true });
        window.location.reload();
      })
      .catch(() => {
        setMsg(t('auth.error'));
      })
      .finally(() => {
        setIsloading(false);
      });
  }

  return (
    <>
      <Head title={t('head.login')} />

      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Form
          form={form}
          style={{ minWidth: 300, maxWidth: 500 }}
          initialValues={{ remember: false, autoLogin: false }}
          onFinish={doLogin}
        >
          <div className="flex flex-col items-center justify-center pb-4">
            <img
              id="logo"
              src="/sipeed.ico"
              alt="Sipeed"
              onClick={(evt) => {
                evt.preventDefault();
                (evt.target as HTMLImageElement).classList.add('animate-spin');
                setTimeout(() => {
                  (evt.target as HTMLImageElement).classList.remove('animate-spin');
                }, 1000);
              }}
            />
          </div>
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

          <div className="flex items-center justify-between pb-3">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox
                onChange={(e) => {
                  setRememberChecked(e.target.checked);
                  if (!e.target.checked) {
                    form.setFieldValue('autoLogin', false);
                  }
                }}
              >
                {t('auth.rememberPassword')}
              </Checkbox>
            </Form.Item>
            <Form.Item name="autoLogin" valuePropName="checked" noStyle>
              <Checkbox disabled={!rememberChecked}>{t('auth.autoLogin')}</Checkbox>
            </Form.Item>
          </div>

          <div className="pb-1 text-red-500">{msg}</div>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={isLoading}>
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
