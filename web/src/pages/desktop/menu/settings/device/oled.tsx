import { useEffect, useState } from 'react';
import { Select } from 'antd';
import { ScreenShareOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Oled = () => {
  const { t } = useTranslation();

  const [isOLEDExist, setIsOLEDExist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sleep, setSleep] = useState('');

  useEffect(() => {
    api.getOLED().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      if (!rsp.data.exist) {
        return;
      }

      setIsOLEDExist(true);
      setSleep(rsp.data.sleep.toString());
    });
  }, []);

  const options = [0, 15, 30, 60, 180, 300, 600, 1800, 3600].map((duration) => ({
    value: duration.toString(),
    label: t(`settings.device.oled.${duration}`)
  }));

  function update(value: string) {
    if (isLoading) return;
    setIsLoading(true);

    api
      .setOLED(parseInt(value))
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setSleep(value);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-1">
        <span>{t('settings.device.oled.title')}</span>
        <span className="text-xs text-neutral-500">{t('settings.device.oled.description')}</span>
      </div>

      {isOLEDExist ? (
        <Select
          style={{ width: 150 }}
          value={sleep}
          options={options}
          loading={isLoading}
          onChange={update}
        />
      ) : (
        <span className="text-neutral-500">
          <ScreenShareOff size={16} />
        </span>
      )}
    </div>
  );
};
