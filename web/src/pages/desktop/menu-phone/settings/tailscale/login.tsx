import { useState } from 'react';
import { UserSwitchOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useTranslation } from 'react-i18next';

import { loginTailscale } from '@/api/network.ts';

type LoginProps = {
  onSuccess: () => void;
};

export const Login = ({ onSuccess }: LoginProps) => {
  const { t } = useTranslation();

  const [isLogging, setIsLogging] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [errMsg, setErrMsg] = useState('');

  function login() {
    if (isLogging) return;
    setIsLogging(true);

    loginTailscale()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        // already logged in
        if (rsp.data.status === 'running') {
          onSuccess();
          return;
        }

        const url = rsp.data.url;
        if (!url) return;

        setLoginUrl(url);
        window.open(url, '_blank');
        setTimeout(() => setLoginUrl(''), 10 * 60 * 1000);
      })
      .finally(() => {
        setIsLogging(false);
      });
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Card style={{ margin: '20px 0 20px 0' }}>{t('tailscale.notLogin')}</Card>

      {!loginUrl ? (
        <Button
          type="primary"
          size="large"
          shape="round"
          icon={<UserSwitchOutlined />}
          loading={isLogging}
          onClick={login}
        >
          {t('tailscale.login')}
        </Button>
      ) : (
        <>
          <Button type="link" href={loginUrl} target="_blank">
            {loginUrl}
          </Button>

          <span className="text-sm text-neutral-500">{t('tailscale.urlPeriod')}</span>

          <Button type="primary" size="large" shape="round" onClick={onSuccess}>
            {t('tailscale.loginSuccess')}
          </Button>
        </>
      )}

      {errMsg && <span className="text-red-500">{errMsg}</span>}
    </div>
  );
};
