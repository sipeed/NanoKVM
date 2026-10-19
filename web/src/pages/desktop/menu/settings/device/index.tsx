import { useAuth } from '@/contexts/auth.ts';
import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Advanced } from './advanced';
import { Hdmi } from './hdmi.tsx';
import { Mdns } from './mdns.tsx';
import { MouseJiggler } from './mouse-jiggler.tsx';
import { Oled } from './oled.tsx';
import { Reboot } from './reboot.tsx';
import { Ssh } from './ssh.tsx';
import { VirtualDevices } from './virtual-devices.tsx';

export const Device = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  return (
    <>
      <div className="text-base">{t('settings.device.title')}</div>
      <Divider className="opacity-50" />

      <div className="flex flex-col space-y-8">
        <Ssh />
        <Mdns />
        <Hdmi />
        <Divider className="opacity-50" />

        {/* Virtual devices share the virtual-media API, so they follow the media.mount permission */}
        {hasPermission('media.mount') && (
          <>
            <VirtualDevices />
            <Divider className="opacity-50" />
          </>
        )}

        <Oled />
        <MouseJiggler />
        <Divider className="opacity-50" />

        <Advanced />
      </div>

      <Divider className="opacity-50" />

      <Reboot />
    </>
  );
};
