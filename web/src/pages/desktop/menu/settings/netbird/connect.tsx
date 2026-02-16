import { useState } from 'react';
import { Button, Card, Input } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';

type ConnectProps = {
  onSuccess: () => void;
};

export const Connect = ({ onSuccess }: ConnectProps) => {
  const { t } = useTranslation();

  const [setupKey, setSetupKey] = useState('');
  const [managementUrl, setManagementUrl] = useState('');
  const [adminUrl, setAdminUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  function connect() {
    if (isLoading) return;
    setErrMsg('');

    const key = setupKey.trim();
    const mgmt = managementUrl.trim();
    const admin = adminUrl.trim();

    if (!key || !mgmt) {
      setErrMsg(t('settings.netbird.invalidInput'));
      return;
    }

    setIsLoading(true);

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
        setIsLoading(false);
      });
  }

  return (
    <Card className="space-y-3">
      <div className="space-y-3">
        <div className="text-base">{t('settings.netbird.connectTitle')}</div>

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

        <Button type="primary" loading={isLoading} onClick={connect}>
          {t('settings.netbird.connect')}
        </Button>
      </div>

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onSuccess} />}
    </Card>
  );
};
