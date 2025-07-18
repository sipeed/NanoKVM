import { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import { VirtualDevices } from './virtual-devices.tsx';
import * as api from '@/api/usb-device.ts';


export const Usb = () => {
  const { t } = useTranslation();
  const [isUsbOn, setIsUsbOn] = useState(false);
  const [isLoading, setLoading] = useState(false);
  
  useEffect(() => {
    api.getUsbState().then((rsp) => {
      if (rsp.code !== 0) {
        return;
      }

      setIsUsbOn(rsp.data.enabled);
    });
  }, []);
  
  function update() {
    if (isLoading) return;
    setLoading(true);

    const func = isUsbOn ? api.disableUsb() : api.enableUsb();

    func.then((rsp) => {
      if (rsp.code !== 0) {
        return;
      }
      setIsUsbOn(!isUsbOn);
    })
    .finally(() => {
      setLoading(false);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span>{t('settings.device.usb')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.usbDesc')}</span>
        </div>

        <Switch checked={isUsbOn} loading={isLoading} onChange={() => update()} />
      </div>

      {isUsbOn ? <VirtualDevices /> : ""}
    </>
  );
};