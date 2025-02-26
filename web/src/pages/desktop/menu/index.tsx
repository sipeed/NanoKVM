import { useEffect, useState } from 'react';
import { Divider } from 'antd';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { MenuIcon, XIcon } from 'lucide-react';
import Draggable from 'react-draggable';

import { getMenuDisabledItems } from '@/lib/localstorage.ts';
import { menuDisabledItemsAtom } from '@/jotai/settings.ts';

import { DownloadImage } from './download.tsx';
import { Fullscreen } from './fullscreen';
import { Image } from './image';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';
import { Power } from './power';
import { Screen } from './screen';
import { Script } from './script';
import { Settings } from './settings';
import { Terminal } from './terminal';
import { Wol } from './wol';

export const Menu = () => {
  const [menuDisabledItems, setMenuDisabledItems] = useAtom(menuDisabledItemsAtom);

  const [isMenuOpen, setIsMenuOpen] = useState(true);

  useEffect(() => {
    const items = getMenuDisabledItems();
    setMenuDisabledItems(items);
  }, []);

  return (
    <Draggable positionOffset={{ x: '-50%', y: '0%' }}>
      <div className="fixed left-1/2 top-[10px] z-[1000] -translate-x-1/2">
        <div className="sticky top-[10px]">
          <div
            className={clsx(
              'h-[36px] items-center rounded bg-neutral-800/80',
              isMenuOpen ? 'flex' : 'hidden'
            )}
          >
            <div className="hidden h-[30px] select-none items-center px-3 sm:flex">
              <img src="/sipeed.ico" width={18} height={18} alt="sipeed" />
            </div>

            <Screen />
            <Keyboard />
            <Mouse />
            <Divider type="vertical" />

            {!menuDisabledItems.includes('image') && <Image />}
            {!menuDisabledItems.includes('download') && <DownloadImage />}
            {!menuDisabledItems.includes('script') && <Script />}
            {!menuDisabledItems.includes('terminal') && <Terminal />}
            {!menuDisabledItems.includes('wol') && <Wol />}

            {['image', 'script', 'terminal', 'wol', 'download'].some(
              (key) => !menuDisabledItems.includes(key)
            ) && <Divider type="vertical" />}

            {!menuDisabledItems.includes('power') && (
              <>
                <Power />
                <Divider type="vertical" />
              </>
            )}

            <Settings />
            <Fullscreen />

            <div
              className="mr-1 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white"
              onClick={() => setIsMenuOpen((o) => !o)}
            >
              <XIcon size={20} />
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
    </Draggable>
  );
};
