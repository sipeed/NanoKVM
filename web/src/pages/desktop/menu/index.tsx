import { useState } from 'react';
import { Divider } from 'antd';
import clsx from 'clsx';
import { MenuIcon, XIcon } from 'lucide-react';

import { Fullscreen } from './fullscreen.tsx';
import { Image } from './image';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse.tsx';
import { Power } from './power.tsx';
import { Screen } from './screen';
import { Script } from './script';
import { Settings } from './settings';
import { Terminal } from './terminal';
import { Wol } from './wol.tsx';
import { DownloadImage } from './download.tsx';

export const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <div className="fixed left-1/2 top-[10px] z-[1000] -translate-x-1/2">
      <div className="sticky top-[10px]">
        <div
          className={clsx(
            'h-[40px] items-center justify-between rounded bg-neutral-800/90',
            isMenuOpen ? 'flex' : 'hidden'
          )}
        >
          <div className="flex h-[30px] select-none items-center px-3">
            <img src="/sipeed.ico" width={18} height={18} alt="sipeed" />
          </div>

          <Screen />
          <Keyboard />
          <Mouse />
          <Divider type="vertical" />

          <Image />
          <Script />
          <Terminal />
          <Wol />
          <DownloadImage />
          <Divider type="vertical" />

          <Power />
          <Divider type="vertical" />

          <Settings />
          <Fullscreen />
          <div
            className="mr-2 flex h-[30px] cursor-pointer items-center justify-center space-x-1 rounded px-2 text-white hover:bg-neutral-700"
            onClick={() => setIsMenuOpen((o) => !o)}
          >
            <span className="pt-[2px]">
              <XIcon size={20} />
            </span>
          </div>
        </div>

        {!isMenuOpen && (
          <div
            className="flex h-[30px] w-[50px] items-center justify-center rounded bg-neutral-800/50 text-white/50 hover:bg-neutral-800 hover:text-white"
            onClick={() => setIsMenuOpen((o) => !o)}
          >
            <MenuIcon />
          </div>
        )}
      </div>
    </div>
  );
};
