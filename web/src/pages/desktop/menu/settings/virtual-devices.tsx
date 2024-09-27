import { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/virtual-device';

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
      <div
        className="flex cursor-pointer select-none items-center justify-between space-x-3 rounded px-3 py-1.5 text-white hover:bg-neutral-600"
        onClick={() => update('disk')}
      >
        <div>{t('virtualDevice.disk')}</div>
        <Switch size="small" checked={isDiskOn} loading={loading === 'disk'} />
      </div>

      <div
        className="flex cursor-pointer select-none items-center justify-between space-x-3 rounded px-3 py-1.5 text-white hover:bg-neutral-600"
        onClick={() => update('network')}
      >
        <div>{t('virtualDevice.network')}</div>
        <Switch size="small" checked={isNetworkOn} loading={loading === 'network'} />
      </div>
    </>
  );
};
