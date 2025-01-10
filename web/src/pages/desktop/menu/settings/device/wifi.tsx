import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';

export const Wifi = () => {
  const { t } = useTranslation();

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    api.getWiFi().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setIsSupported(rsp.data?.supported);
    });
  }, []);

  function open() {
    window.open('/#/wifi', '_blank');
  }

  return (
    <>
      {isSupported && (
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span>{t('settings.device.wifi.title')}</span>
            <span className="text-xs text-neutral-500">
              {t('settings.device.wifi.description')}
            </span>
          </div>

          <Button type="primary" size="small" onClick={open}>
            {t('settings.device.wifi.setBtn')}
          </Button>
        </div>
      )}
    </>
  );
};
