import { useState } from 'react';
import { Alert, Button, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';
import { Status } from './types.ts';

type UpdateProps = {
  status: Status;
  onSuccess: () => void;
};

export const Update = ({ status, onSuccess }: UpdateProps) => {
  const { t } = useTranslation();

  const [isUpdating, setIsUpdating] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  function update() {
    if (isUpdating) return;
    setIsUpdating(true);
    setErrMsg('');

    api
      .update()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        onSuccess();
      })
      .catch((err) => {
        // The update stops the daemon, so a request that travelled through
        // NetBird itself can fail here while the device completes it. Ask for a
        // fresh status instead of reporting the transport error as an outcome.
        setErrMsg(err.message || 'Update failed');
        onSuccess();
      })
      .finally(() => {
        setIsUpdating(false);
      });
  }

  return (
    <>
      <Alert
        className="mb-4"
        type="info"
        showIcon
        message={t('settings.netbird.updateAvailable')}
        description={
          <div className="flex flex-col space-y-2">
            <div>
              {status.installedVersion || status.version} → {status.pinnedVersion}
            </div>
            <div>{t('settings.netbird.updateHint')}</div>
            <div>
              <Popconfirm
                placement="bottom"
                title={t('settings.netbird.updateConfirm')}
                description={t('settings.netbird.updateWarning')}
                okText={t('settings.netbird.okBtn')}
                cancelText={t('settings.netbird.cancelBtn')}
                onConfirm={update}
              >
                <Button type="primary" size="small" loading={isUpdating}>
                  {t('settings.netbird.update')}
                </Button>
              </Popconfirm>
            </div>
          </div>
        }
      />

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onSuccess} canRestart />}
    </>
  );
};
