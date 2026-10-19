import { useState } from 'react';
import { Alert, Button, Popconfirm, Space } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

type ErrorHelpProps = {
  error: string;
  onRefresh: () => void;
  // A failed request alone is not evidence that NetBird is installed. Callers
  // must opt in only after observing an installed state, otherwise a status
  // error on a fresh Settings page could offer a destructive restart.
  canRestart?: boolean;
};

export const ErrorHelp = ({ error, onRefresh, canRestart = false }: ErrorHelpProps) => {
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
      .catch((err) => {
        setActionError(err.message || 'Restart failed');
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
        {canRestart && (
          <Popconfirm
            title={t('settings.netbird.restart')}
            onConfirm={restartService}
            okText={t('settings.netbird.okBtn')}
            cancelText={t('settings.netbird.cancelBtn')}
            placement="bottom"
            disabled={isRestarting}
          >
            <Button loading={isRestarting}>{t('settings.netbird.error.restartButton')}</Button>
          </Popconfirm>
        )}
        <Button onClick={onRefresh}>{t('settings.netbird.error.refreshButton')}</Button>
      </Space>
    </div>
  );
};
