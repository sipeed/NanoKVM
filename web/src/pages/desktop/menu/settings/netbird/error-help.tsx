import { useState } from 'react';
import { Alert, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

type ErrorHelpProps = {
  error: string;
  onRefresh: () => void;
};

export const ErrorHelp = ({ error, onRefresh }: ErrorHelpProps) => {
  const { t } = useTranslation();
  const [isRestarting, setIsRestarting] = useState(false);
  const [actionError, setActionError] = useState('');

  function restartService() {
    if (isRestarting) return;
    setIsRestarting(true);
    setActionError('');

    api
      .restart()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setActionError(rsp.msg);
          return;
        }

        onRefresh();
      })
      .finally(() => {
        setIsRestarting(false);
      });
  }

  const details = [
    t('settings.netbird.error.stepWait'),
    t('settings.netbird.error.stepRestartUI'),
    t('settings.netbird.error.stepRestartSSH'),
    t('settings.netbird.error.stepReboot')
  ].join('\n');

  const description = `${t('settings.netbird.error.intro')}\n${error}${actionError ? `\n${actionError}` : ''}\n\n${details}`;

  return (
    <div className="pt-4">
      <Alert
        type="error"
        showIcon
        message={t('settings.netbird.error.title')}
        description={
          <div className="whitespace-pre-line break-all text-xs text-red-400">{description}</div>
        }
      />

      <Space className="pt-3">
        <Button loading={isRestarting} onClick={restartService}>
          {t('settings.netbird.error.restartButton')}
        </Button>
        <Button onClick={onRefresh}>{t('settings.netbird.error.refreshButton')}</Button>
      </Space>
    </div>
  );
};
