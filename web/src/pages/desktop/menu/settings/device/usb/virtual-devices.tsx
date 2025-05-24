import { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/virtual-device.ts';

export const VirtualDevices = () => {
  const { t } = useTranslation();

  const [isNetworkOn, setIsNetworkOn] = useState(false);
  const [isMediaOn, setIsMediaOn] = useState(false);
  const [isDiskOn, setIsDiskOn] = useState(false);
  const [loading, setLoading] = useState(''); // '' | 'network' | 'media' | 'disk'

  useEffect(() => {
    api.getVirtualDevice().then((rsp) => {
      if (rsp.code !== 0) {
        return;
      }

      setIsNetworkOn(rsp.data.network);
      setIsMediaOn(rsp.data.media);
      setIsDiskOn(rsp.data.disk);
    });
  }, []);

  function update(device: 'network' | 'media' | 'disk') {
    if (loading) return;
    setLoading(device);

    api
      .updateVirtualDevice(device)
      .then((rsp) => {
        if (rsp.code !== 0) {
          return;
        }

        switch (device) {
          case 'network':
            setIsNetworkOn(rsp.data.on);
            break;
          case 'media':
            setIsMediaOn(rsp.data.on);
            break;
          case 'disk':
            setIsDiskOn(rsp.data.on);
            break;
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
          <span>{t('settings.device.media')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.mediaDesc')}</span>
        </div>

        <Switch checked={isMediaOn} loading={loading === 'media'} onChange={() => update('media')} />
      </div>

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
