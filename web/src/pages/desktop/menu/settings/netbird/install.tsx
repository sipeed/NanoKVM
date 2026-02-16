import { useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Card, Result } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';

type InstallProps = {
  setIsLocked: (isLocked: boolean) => void;
  onSuccess: () => void;
};

export const Install = ({ setIsLocked, onSuccess }: InstallProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  function install() {
    if (isLoading) return;
    setIsLocked(true);
    setIsLoading(true);

    api
      .install()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        onSuccess();
      })
      .finally(() => {
        setIsLoading(false);
        setIsLocked(false);
      });
  }

  return (
    <Card>
      <Result
        icon={<DownloadOutlined />}
        subTitle={t('settings.netbird.notInstall')}
        extra={
          <Button key="install" type="primary" loading={isLoading} onClick={install}>
            {isLoading ? t('settings.netbird.installing') : t('settings.netbird.install')}
          </Button>
        }
      />

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onSuccess} />}
    </Card>
  );
};
