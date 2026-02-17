import { useState } from 'react';
import { UserSwitchOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';

type LoginProps = {
  onSuccess: () => void;
};

export const Login = ({ onSuccess }: LoginProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [errMsg, setErrMsg] = useState('');

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
        setTimeout(() => setLoginUrl(''), 10 * 60 * 1000);
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
        <div className="flex w-full flex-col items-center justify-center space-y-5">
          <Button type="link" href={loginUrl} target="_blank">
            {loginUrl}
          </Button>

          <span className="text-xs text-neutral-600">{t('settings.netbird.urlPeriod')}</span>

          <Button type="primary" size="large" shape="round" onClick={onSuccess}>
            {t('settings.netbird.loginSuccess')}
          </Button>
        </div>
      )}

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onSuccess} />}
    </div>
  );
};
