import { useEffect } from 'react';
import { Divider } from 'antd';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';
import { hidModeAtom } from '@/jotai/mouse.ts';

import { Advanced } from './advanced';
import { HidMode } from './hid-mode.tsx';
import { Mdns } from './mdns.tsx';
import { MouseJiggler } from './mouse-jiggler.tsx';
import { Oled } from './oled.tsx';
import { Reboot } from './reboot.tsx';
import { Ssh } from './ssh.tsx';
import { Tls } from './tls.tsx';
import { VirtualDevices } from './virtual-devices.tsx';
import { Wifi } from './wifi.tsx';

export const Device = () => {
  const { t } = useTranslation();

  const [hidMode, setHidMode] = useAtom(hidModeAtom);

  useEffect(() => {
    api.getHidMode().then((rsp) => {
      if (rsp.code === 0) {
        setHidMode(rsp.data.mode);
      }
    });
  }, []);

  return (
    <>
      <div className="text-base font-bold">{t('settings.device.title')}</div>
      <Divider />

      <div className="flex flex-col space-y-6">
        <Tls />
        <Ssh />
        <Mdns />

        {hidMode === 'normal' ? <VirtualDevices /> : <HidMode />}
      </div>
      <Divider />

      <div className="flex flex-col space-y-6">
        <Oled />
        <Wifi />
        <MouseJiggler />
      </div>
      <Divider />

      <Advanced />
      <Divider />

      <Reboot />
    </>
  );
};
