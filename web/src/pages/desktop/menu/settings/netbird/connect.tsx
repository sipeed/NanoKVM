import { useState } from 'react';
import { UserSwitchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Segmented } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';

type ConnectProps = {
  onSuccess: () => void;
  defaultManagementUrl?: string;
};

type Mode = 'official' | 'custom';

export const Connect = ({ onSuccess, defaultManagementUrl }: ConnectProps) => {
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>(
    defaultManagementUrl && !defaultManagementUrl.includes('api.netbird.io') ? 'custom' : 'official'
  );

  // Official server state
  const [loginUrl, setLoginUrl] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Custom server state
  const [setupKey, setSetupKey] = useState('');
  const [managementUrl, setManagementUrl] = useState(defaultManagementUrl || '');
  const [adminUrl, setAdminUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const [errMsg, setErrMsg] = useState('');

  function login() {
    if (isLoginLoading) return;
    setErrMsg('');
    setIsLoginLoading(true);

    api
      .login()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        const url = rsp.data?.url;
        if (!url) {
          onSuccess();
          return;
        }

        setLoginUrl(url);
        window.open(url, '_blank');
        setTimeout(() => setLoginUrl(''), 10 * 60 * 1000);
      })
      .finally(() => {
        setIsLoginLoading(false);
      });
  }

  function connect() {
    if (isConnecting) return;
    setErrMsg('');

    const key = setupKey.trim();
    const mgmt = managementUrl.trim();
    const admin = adminUrl.trim();

    if (!key || !mgmt) {
      setErrMsg(t('settings.netbird.invalidInput'));
      return;
    }

    setIsConnecting(true);

    api
      .up(key, mgmt, admin)
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }
        onSuccess();
      })
      .finally(() => {
        setIsConnecting(false);
      });
  }

  return (
    <Card className="space-y-3">
      <div className="space-y-3">
        <div className="text-base">{t('settings.netbird.connectTitle')}</div>

        <Segmented
          block
          value={mode}
          onChange={(val) => {
            setMode(val as Mode);
            setErrMsg('');
            setLoginUrl('');
          }}
          options={[
            { label: t('settings.netbird.officialServer'), value: 'official' },
            { label: t('settings.netbird.customServer'), value: 'custom' }
          ]}
        />

        {mode === 'official' && (
          <div className="flex flex-col items-center space-y-4 pt-2">
            {loginUrl === '' ? (
              <Button
                type="primary"
                size="large"
                shape="round"
                icon={<UserSwitchOutlined />}
                loading={isLoginLoading}
                onClick={login}
              >
                {t('settings.netbird.login')}
              </Button>
            ) : (
              <div className="flex w-full flex-col items-center space-y-3">
                <Button type="link" href={loginUrl} target="_blank">
                  {loginUrl}
                </Button>
                <span className="text-xs text-neutral-600">
                  {t('settings.netbird.urlPeriod')}
                </span>
                <Button type="primary" size="large" shape="round" onClick={onSuccess}>
                  {t('settings.netbird.loginSuccess')}
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === 'custom' && (
          <>
            <Input.Password
              placeholder={t('settings.netbird.setupKey')}
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
            />

            <Input
              placeholder={t('settings.netbird.managementUrl')}
              value={managementUrl}
              onChange={(e) => setManagementUrl(e.target.value)}
            />

            <Input
              placeholder={t('settings.netbird.adminUrl')}
              value={adminUrl}
              onChange={(e) => setAdminUrl(e.target.value)}
            />

            <Button type="primary" loading={isConnecting} onClick={connect}>
              {t('settings.netbird.connect')}
            </Button>
          </>
        )}
      </div>

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onSuccess} />}
    </Card>
  );
};
