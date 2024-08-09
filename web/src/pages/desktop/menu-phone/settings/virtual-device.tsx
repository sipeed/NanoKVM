import { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/virtual-device';

export const VirtualDevice = () => {
  const { t } = useTranslation();
  const [isNetworkOn, setIsNetworkOn] = useState(false);
  const [isUSBOn, setIsUSBOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    if (isLoading) return;
    setIsLoading(true);

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
        setIsLoading(false);
      });
  }

  return (
    <>
      <div
        className="flex cursor-pointer select-none items-center space-x-1 rounded px-3 py-1.5 text-white hover:bg-neutral-600"
        onClick={() => update('network')}
      >
        {isNetworkOn && <CheckIcon size={18} color="#3b82f6" />}
        <span>{t('virtualDevice.network')}</span>
      </div>
      <div
        className="flex cursor-pointer select-none items-center space-x-1 rounded px-3 py-1.5 text-white hover:bg-neutral-600"
        onClick={() => update('usb')}
      >
        {isUSBOn && <CheckIcon size={18} color="#3b82f6" />}
        <span>{t('virtualDevice.usb')}</span>
      </div>
    </>
  );
};
