import { useEffect, useRef, useState } from 'react';
import { UserSwitchOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';
import { LoginUrl } from './login-url.tsx';

type LoginProps = {
  onSuccess: () => void;
};

export const Login = ({ onSuccess }: LoginProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const loginTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (loginTimer.current) clearTimeout(loginTimer.current);
    };
  }, []);

  function login() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .login()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        const url = rsp.data.url;
        if (!url) {
          onSuccess();
          return;
        }

        setLoginUrl(url);
        window.open(url, '_blank');
        loginTimer.current = setTimeout(() => setLoginUrl(''), 10 * 60 * 1000);
      })
      .catch((err) => {
        setErrMsg(err.message || 'Login failed');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-10">
      <Card>{t('settings.netbird.notLogin')}</Card>

      {loginUrl === '' ? (
        <Button
          type="primary"
          size="large"
          shape="round"
          icon={<UserSwitchOutlined />}
          loading={isLoading}
          onClick={login}
        >
          {t('settings.netbird.login')}
        </Button>
      ) : (
        <LoginUrl url={loginUrl} onConfirm={onSuccess} />
      )}

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onSuccess} canRestart />}
    </div>
  );
};
