import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Advanced } from './advanced';
import { Hdmi } from './hdmi.tsx';
import { Mdns } from './mdns.tsx';
import { MouseJiggler } from './mouse-jiggler.tsx';
import { Oled } from './oled.tsx';
import { Reboot } from './reboot.tsx';
import { Ssh } from './ssh.tsx';
import { Tls } from './tls.tsx';
import { UsbDescriptor } from './usb-descriptor';
import { VirtualDevices } from './virtual-devices.tsx';
import { Wifi } from './wifi.tsx';

export const Device = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-base">{t('settings.device.title')}</div>
      <Divider className="opacity-50" />

      <div className="flex flex-col space-y-8">
        <Tls />
        <Ssh />
        <Mdns />
        <Hdmi />
        <Divider className="opacity-50" />

        <VirtualDevices />
        <Divider className="opacity-50" />

        <UsbDescriptor />
        <Divider className="opacity-50" />

        <Oled />
        <Wifi />
        <MouseJiggler />
        <Divider className="opacity-50" />

        <Advanced />
      </div>

      <Divider className="opacity-50" />

      <Reboot />
    </>
  );
};
