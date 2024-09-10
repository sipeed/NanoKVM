import { useState } from 'react';
import { Badge, Divider, Popover } from 'antd';
import { useAtom } from 'jotai';
import { SettingsIcon } from 'lucide-react';

import { isSettingsOpenAtom } from '@/jotai/settings.ts';

import { About } from './about.tsx';
import { Language } from './language.tsx';
import { Logout } from './logout.tsx';
import { Password } from './password.tsx';
import { Tailscale } from './tailscale';
import { Update } from './update.tsx';
import { VirtualDevices } from './virtual-devices.tsx';

export const Settings = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useAtom(isSettingsOpenAtom);
  const [isBadgeVisible, setIsBadgeVisible] = useState(false);

  const content = (
    <>
      <Language />
      <About />
      <Update setIsBadgeVisible={setIsBadgeVisible} />
      <Divider style={{ margin: '5px 0' }} />

      <VirtualDevices />
      <Divider style={{ margin: '5px 0' }} />

      <Tailscale />
      <Divider style={{ margin: '5px 0' }} />

      <Password />
      <Logout />
    </>
  );

  return (
    <>
      <Popover
        content={content}
        placement="rightBottom"
        trigger="click"
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      >
        <div className="flex h-[30px] cursor-pointer items-center justify-center space-x-1 rounded px-2 text-white hover:bg-neutral-700">
          <Badge dot={isBadgeVisible} color="blue" offset={[1, 0]}>
            <SettingsIcon size={18} />
          </Badge>
        </div>
      </Popover>
    </>
  );
};
