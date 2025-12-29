import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { CircleHelpIcon, EthernetPortIcon, WifiIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

import { Hostname } from './hostname.tsx';

type IP = {
  name: string;
  addr: string;
  version: string;
  type: string;
};

type Info = {
  ips: IP[];
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
      <div className="text-neutral-400">{t('settings.about.information')}</div>

      <div className="mt-5 flex w-full flex-col space-y-5">
        {/* IP list */}
        <div className="flex w-full items-start justify-between">
          <span>{t('settings.about.ip')}</span>
          {information?.ips && information.ips.length > 0 ? (
            <div className="flex flex-col space-y-1">
              {information.ips.map((ip) => (
                <div key={ip.addr} className="flex items-center justify-end space-x-2">
                  <span>{ip.addr}</span>
                  <div className="size-[16px] text-neutral-500">
                    {ip.type === 'Wireless' ? (
                      <WifiIcon size={16} />
                    ) : (
                      <EthernetPortIcon size={16} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* mDNS */}
        {!!information?.mdns && (
          <div className="flex w-full items-center justify-between">
            <span>{t('settings.about.mdns')}</span>
            <span>{information.mdns}</span>
          </div>
        )}

        {/* image version */}
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

        {/* application version */}
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

        <Hostname />
      </div>
    </>
  );
};
