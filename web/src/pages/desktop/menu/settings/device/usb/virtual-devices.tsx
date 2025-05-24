import { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/virtual-device.ts';

export const VirtualDevices = () => {
  const { t } = useTranslation();

  const [isNetworkOn, setIsNetworkOn] = useState(false);
  const [isDiskOn, setIsDiskOn] = useState(false);
  const [loading, setLoading] = useState(''); // '' | 'network' | 'disk'

  useEffect(() => {
    api.getVirtualDevice().then((rsp) => {
      if (rsp.code !== 0) {
        return;
      }

      setIsNetworkOn(rsp.data.network);
      setIsDiskOn(rsp.data.disk);
    });
  }, []);

  function update(device: 'network' | 'disk') {
    if (loading) return;
    setLoading(device);

    api
      .updateVirtualDevice(device)
      .then((rsp) => {
        if (rsp.code !== 0) {
          return;
        }

        if (device === 'network') {
          setIsNetworkOn(rsp.data.on);
        } else {
          setIsDiskOn(rsp.data.on);
        }
      })
      .finally(() => {
        setLoading('');
      });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span>{t('settings.device.disk')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.diskDesc')}</span>
        </div>

        <Switch checked={isDiskOn} loading={loading === 'disk'} onChange={() => update('disk')} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span>{t('settings.device.network')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.networkDesc')}</span>
        </div>

        <Switch
          checked={isNetworkOn}
          loading={loading === 'network'}
          onChange={() => update('network')}
        />
      </div>
    </>
  );
};
