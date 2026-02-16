import { useState } from 'react';
import { Button, Card, Descriptions, Popconfirm, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

import { ErrorHelp } from './error-help.tsx';

import type { Status } from './types.ts';

type DeviceProps = {
  status: Status;
  onRefresh: () => void;
};

export const Device = ({ status, onRefresh }: DeviceProps) => {
  const { t } = useTranslation();

  const [isDownLoading, setIsDownLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const connected = status.state === 'running';

  function disconnect() {
    if (isDownLoading) return;
    setErrMsg('');
    setIsDownLoading(true);

    api
      .down()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }
        onRefresh();
      })
      .finally(() => {
        setIsDownLoading(false);
      });
  }

  return (
    <Card>
      <Descriptions column={1} size="small" labelStyle={{ width: '180px' }}>
        <Descriptions.Item label={t('settings.netbird.state')}>
          <Tag color={connected ? 'green' : 'gold'}>
            {connected ? t('settings.netbird.running') : t('settings.netbird.stopped')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('settings.netbird.deviceName')}>
          {status.name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('settings.netbird.deviceIP')}>{status.ip || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('settings.netbird.managementUrl')}>
          {status.managementUrl || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('settings.netbird.version')}>
          {status.version || '-'}
        </Descriptions.Item>
      </Descriptions>

      <div className="mt-4 flex items-center gap-2">
        <Popconfirm
          title={t('settings.netbird.disconnectConfirm')}
          okText={t('settings.netbird.okBtn')}
          cancelText={t('settings.netbird.cancelBtn')}
          onConfirm={disconnect}
        >
          <Button danger loading={isDownLoading}>
            {t('settings.netbird.disconnect')}
          </Button>
        </Popconfirm>

        <Button onClick={onRefresh}>{t('settings.netbird.refresh')}</Button>
      </div>

      {errMsg && <ErrorHelp error={errMsg} onRefresh={onRefresh} />}
    </Card>
  );
};
