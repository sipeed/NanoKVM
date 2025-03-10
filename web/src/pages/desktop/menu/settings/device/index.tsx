import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Mdns } from './mdns.tsx';
import { Oled } from './oled.tsx';
import { Reboot } from './reboot.tsx';
import { Ssh } from './ssh.tsx';
import { VirtualDevices } from './virtual-devices.tsx';
import { Wifi } from './wifi.tsx';

export const Device = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-base font-bold">{t('settings.device.title')}</div>
      <Divider />

      <div className="flex flex-col space-y-6">
        <Oled />
        <Wifi />
        <Ssh />
        <Mdns />
        <VirtualDevices />
      </div>
      <Divider />

      <Reboot />
    </>
  );
};
