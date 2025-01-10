import { useEffect, useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as api from '@/api/auth.ts';
import { removeToken } from '@/lib/cookie.ts';
import { encrypt } from '@/lib/encrypt.ts';
import { Head } from '@/components/head.tsx';

export const Password = () => {
  const { t } = useTranslation();
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (msg) {
      setTimeout(() => setMsg(''), 3000);
    }
  }, [msg]);

  function changePassword(values: any) {
    if (values.password !== values.password2) {
      setMsg(t('auth.differentPassword'));
      return;
    }
    if (!validateString(values.username)) {
      setMsg(t('auth.illegalUsername'));
      return;
    }
    if (!validateString(values.password)) {
      setMsg('auth.illegalPassword');
      return;
    }

    const username = values.username;
    const password = encrypt(values.password);

    api
      .changePassword(username, password)
      .then((rsp: any) => {
        if (rsp.code !== 0) {
          setMsg(t('auth.error'));
          return;
        }

        removeToken();
        navigate('/auth/login', { replace: true });
      })
      .catch(() => {
        setMsg(t('auth.error'));
      });
  }

  function validateString(str: string) {
    const regex = /['"\\/]/;
    return !regex.test(str);
  }

  function cancel() {
    window.location.replace('/');
  }

  return (
    <>
      <Head title={t('head.changePassword')} />

      <div className="flex h-screen w-screen flex-col items-center justify-center space-y-5">
        <h2 className="text-xl font-semibold text-neutral-100">{t('auth.changePassword')}</h2>

        <Form
          style={{ minWidth: 300, maxWidth: 500 }}
          initialValues={{ remember: true }}
          onFinish={changePassword}
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

          <Form.Item
            name="password2"
            rules={[{ required: true, message: t('auth.noEmptyPassword'), min: 1 }]}
          >
            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder={t('auth.placeholderPassword2')}
            />
          </Form.Item>

          <span className="text-red-500">{msg}</span>
          <Form.Item>
            <div className="flex w-full space-x-2">
              <Button type="primary" htmlType="submit" className="w-1/2">
                {t('auth.ok')}
              </Button>
              <Button className="w-1/2" onClick={cancel}>
                {t('auth.cancel')}
              </Button>
            </div>
          </Form.Item>
        </Form>

        <Card>
          <div className="flex w-[450px] flex-col">
            <div>{t('auth.tips.change1')}</div>
            <ul className="list-outside list-decimal">
              <li>{t('auth.tips.change2')}</li>
              <li>{t('auth.tips.change3')}</li>
            </ul>
            <div className="text-red-500">{t('auth.tips.change4')}</div>
          </div>
        </Card>
      </div>
    </>
  );
};
