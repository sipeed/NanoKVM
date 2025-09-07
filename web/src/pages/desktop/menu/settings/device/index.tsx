import { useEffect } from 'react';
import { Divider } from 'antd';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';
import { hidModeAtom } from '@/jotai/mouse.ts';

import { Advanced } from './advanced';
import { Hdmi } from './hdmi.tsx';
import { HidMode } from './hid-mode.tsx';
import { Mdns } from './mdns.tsx';
import { MouseJiggler } from './mouse-jiggler.tsx';
import { Oled } from './oled.tsx';
import { Reboot } from './reboot.tsx';
import { Ssh } from './ssh.tsx';
import { Tls } from './tls.tsx';
import { Usb } from './usb/index.tsx';
import { Wifi } from './wifi.tsx';
import { menuDisabledItemsAtom } from '@/jotai/settings.ts';

export const Device = () => {
  const { t } = useTranslation();
  const disableMenus = useAtomValue(menuDisabledItemsAtom)
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
        {!disableMenus.includes('device:tls') && <Tls />}
        {!disableMenus.includes('device:ssh') && <Ssh />}
        {!disableMenus.includes('device:mdns') && <Mdns />}
        {!disableMenus.includes('device:hdmi') && <Hdmi />}


        {hidMode === 'normal' ? <Usb/> : <HidMode />}
      </div>
      <Divider />

      <div className="flex flex-col space-y-6">
        {!disableMenus.includes('device:oled') && <Oled />}
        {!disableMenus.includes('device:wifi') && <Wifi />}
        {!disableMenus.includes('device:mouse') && <MouseJiggler />}

      </div>
      <Divider />

      <Advanced disable={disableMenus.includes("device:advance")} />
      <Divider />

      <Reboot />
    </>
  );
};
