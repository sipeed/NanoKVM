import { useEffect, useRef, useState } from 'react';
import { Divider, Tooltip } from 'antd';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { MenuIcon, XIcon } from 'lucide-react';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';

import { getMenuDisabledItems, loadIsAdmin } from '@/lib/localstorage.ts';
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
  const { t } = useTranslation();
  const [menuDisabledItems, setMenuDisabledItems] = useAtom(menuDisabledItemsAtom);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const isAdmin = loadIsAdmin();
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  const nodeRef = useRef<any>(null);

  useEffect(() => {
    // disabled menu items
    const items = getMenuDisabledItems();
    setMenuDisabledItems(items);

    // react-draggable bounds
    const handleResize = () => {
      if (!nodeRef.current) return;

      const elementRect = nodeRef.current.getBoundingClientRect();
      const width = (window.innerWidth - elementRect.width) / 2;

      setBounds({
        left: -width,
        top: -10,
        right: width,
        bottom: window.innerHeight - elementRect.height - 10
      });
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds={bounds}
      handle="strong"
      positionOffset={{ x: '-50%', y: '0%' }}
    >
      <div ref={nodeRef} className="fixed left-1/2 top-[10px] z-[1000] -translate-x-1/2">
        <div className="sticky top-[10px] flex w-full justify-center">
          <div
            className={clsx(
              'h-[36px] items-center rounded bg-neutral-800/80',
              isMenuOpen ? 'flex' : 'hidden'
            )}
          >
            <strong>
              <div className="hidden h-[30px] cursor-move select-none items-center px-3 sm:flex">
                <img src="/sipeed.ico" width={18} height={18} draggable={false} alt="sipeed" />
              </div>
            </strong>

            <Screen />
            <Keyboard />
            <Mouse />
            <Divider type="vertical" />

            {!menuDisabledItems.includes('image') && <Image />}
            {!menuDisabledItems.includes('download') && <DownloadImage />}
            {!menuDisabledItems.includes('script') && <Script />}
            {isAdmin && !menuDisabledItems.includes('terminal') && <Terminal />}
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

            <Tooltip title={t('menu.collapse')} placement="bottom" mouseEnterDelay={0.6}>
              <div
                className="mr-1 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
                onClick={() => setIsMenuOpen((o) => !o)}
              >
                <XIcon size={20} />
              </div>
            </Tooltip>
          </div>
        </div>

        {!isMenuOpen && (
          <Tooltip title={t('menu.expand')} placement="bottom" mouseEnterDelay={0.6}>
            <div
              className="flex h-[30px] w-[32px] cursor-pointer items-center justify-center rounded bg-neutral-800/50 text-white/50 hover:bg-neutral-700 hover:text-white"
              onClick={() => setIsMenuOpen((o) => !o)}
            >
              <MenuIcon size={20} />
            </div>
          </Tooltip>
        )}
      </div>
    </Draggable>
  );
};
