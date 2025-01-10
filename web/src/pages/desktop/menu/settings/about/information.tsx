import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { CircleHelpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

type Info = {
  ip: string;
  mdns: string;
  image: string;
  application: string;
  deviceKey: string;
};

export const Information = () => {
  const { t } = useTranslation();

  const [information, setInformation] = useState<Info>();

  useEffect(() => {
    api.getInfo().then((rsp: any) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setInformation(rsp.data);
    });
  }, []);

  return (
    <>
      <div className="pb-5 text-neutral-400">{t('settings.about.information')}</div>

      <div className="flex w-full flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <span>{t('settings.about.ip')}</span>
          <span>{information ? information.ip : '-'}</span>
        </div>

        <div className="flex w-full items-center justify-between">
          <span>{t('settings.about.mdns')}</span>
          <span>{information ? information.mdns : '-'}</span>
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>{t('settings.about.image')}</span>
            <Tooltip
              title={t('settings.about.imageTip')}
              className="cursor-pointer text-neutral-500"
              placement="right"
            >
              <CircleHelpIcon size={15} />
            </Tooltip>
          </div>

          <span>{information ? information.image : '-'}</span>
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>{t('settings.about.application')}</span>
            <Tooltip
              title={t('settings.about.applicationTip')}
              className="cursor-pointer text-neutral-500"
              placement="right"
            >
              <CircleHelpIcon size={15} />
            </Tooltip>
          </div>

          <span>{information ? information.application : '-'}</span>
        </div>

        <div className="flex w-full items-center justify-between">
          <span>{t('settings.about.deviceKey')}</span>
          <span>{information ? information.deviceKey : '-'}</span>
        </div>
      </div>
    </>
  );
};
