import { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/virtual-device';

export const VirtualDevices = () => {
  const { t } = useTranslation();
  const [isNetworkOn, setIsNetworkOn] = useState(false);
  const [isUSBOn, setIsUSBOn] = useState(false);
  const [loading, setLoading] = useState(''); // '' | 'network' | 'usb'

  useEffect(() => {
    api.getVirtualDevice().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setIsNetworkOn(rsp.data.network);
      setIsUSBOn(rsp.data.usb);
    });
  }, []);

  function update(device: string) {
    if (loading) return;
    setLoading(device);

    api
      .updateVirtualDevice(device)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        if (device === 'network') {
          setIsNetworkOn(rsp.data.on);
        } else {
          setIsUSBOn(rsp.data.on);
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
        onClick={() => update('network')}
      >
        <div>{t('virtualDevice.network')}</div>
        <Switch size="small" checked={isNetworkOn} loading={loading === 'network'} />
      </div>

      <div
        className="flex cursor-pointer select-none items-center justify-between space-x-3 rounded px-3 py-1.5 text-white hover:bg-neutral-600"
        onClick={() => update('usb')}
      >
        <div>{t('virtualDevice.usb')}</div>
        <Switch size="small" checked={isUSBOn} loading={loading === 'usb'} />
      </div>
    </>
  );
};
