import { useEffect, useRef, useState } from 'react';
import { Divider } from 'antd';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';
import { GripVerticalIcon } from 'lucide-react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

import { getMenuDisabledItems } from '@/lib/localstorage.ts';
import { menuDisabledItemsAtom, submenuOpenCountAtom } from '@/jotai/settings.ts';

import { DownloadImage } from './download.tsx';
import { Fullscreen } from './fullscreen';
import { Image } from './image';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';
import { Collapse, Expand } from './operations';
import { Power } from './power';
import { Screen } from './screen';
import { Script } from './script';
import { Settings } from './settings';
import { Terminal } from './terminal';
import { Wol } from './wol';

const HIDE_TIMEOUT = 8000;

export const Menu = () => {
  const [menuDisabledItems, setMenuDisabledItems] = useAtom(menuDisabledItemsAtom);
  const submenuOpenCount = useAtomValue(submenuOpenCountAtom);

  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [isMenuMoved, setIsMenuMoved] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isMenuHidden, setIsMenuHidden] = useState(false);
  const [menuBounds, setMenuBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // init menu
  useEffect(() => {
    const items = getMenuDisabledItems();
    setMenuDisabledItems(items);

    startCountdown();
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      stopCountdown();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // handle menu bounds
  useEffect(() => {
    handleResize();
  }, [menuDisabledItems, isMenuExpanded]);

  // handle hide timer
  useEffect(() => {
    if (submenuOpenCount === 0 && !isMenuHovered) {
      startCountdown();
      return;
    }

    stopCountdown();
  }, [submenuOpenCount, isMenuHovered]);

  function handleResize() {
    if (!nodeRef.current) return;

    const elementRect = nodeRef.current.getBoundingClientRect();
    const width = (window.innerWidth - elementRect.width) / 2;

    setMenuBounds({
      left: -width,
      top: -10,
      right: width,
      bottom: window.innerHeight - elementRect.height - 10
    });
  }

  function startCountdown() {
    if (submenuOpenCount > 0 || !isMenuExpanded || isMenuMoved) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsMenuHidden(true);
    }, HIDE_TIMEOUT);
  }

  function stopCountdown() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handleMoved(_e: DraggableEvent, data: DraggableData) {
    if (data.x === 0 && data.y === 0) return;
    if (isMenuMoved) return;

    setIsMenuMoved(true);
  }

  function handleHovered(hovered: boolean) {
    setIsMenuHovered(hovered);
    if (hovered) {
      setIsMenuHidden(false);
    }
  }

  function isEnabled(item: string) {
    return !menuDisabledItems.includes(item);
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds={menuBounds}
      handle="strong"
      positionOffset={{ x: '-50%', y: '0%' }}
      onStop={handleMoved}
    >
      <div
        ref={nodeRef}
        className="fixed left-1/2 top-[10px] z-[1000] -translate-x-1/2"
        onMouseEnter={() => handleHovered(true)}
        onMouseLeave={() => handleHovered(false)}
        onBlur={() => handleHovered(false)}
      >
        {/* Trigger area for auto-show when hidden */}
        {isMenuExpanded && (
          <div className="absolute -top-[10px] left-0 right-0 h-[46px] w-full bg-transparent" />
        )}

        {/* Menubar */}
        <div className="sticky top-[10px] flex w-full justify-center">
          <div
            className={clsx(
              'h-[36px] items-center rounded bg-neutral-800/80 transition-all duration-300',
              'h-[36px] items-center rounded bg-neutral-800/80 pl-1 pr-2 transition-all duration-300',
              isMenuExpanded ? 'flex' : 'hidden',
              isMenuHidden ? '-translate-y-[110%] opacity-80' : 'translate-y-0 opacity-100'
            )}
          >
            <strong>
              <div className="flex h-[30px] cursor-move select-none items-center justify-center pl-1 text-neutral-500">
                <GripVerticalIcon size={18} />
              </div>
            </strong>
            <Divider type="vertical" />

            <Screen />
            <Keyboard />
            <Mouse />
            <Divider type="vertical" />

            {isEnabled('image') && <Image />}
            {isEnabled('download') && <DownloadImage />}
            {isEnabled('script') && <Script />}
            {isEnabled('terminal') && <Terminal />}
            {isEnabled('wol') && <Wol />}

            {['image', 'download', 'script', 'terminal', 'wol'].some(isEnabled) && (
              <Divider type="vertical" />
            )}

            {isEnabled('power') && (
              <>
                <Power />
                <Divider type="vertical" />
              </>
            )}

            <Settings />
            {isEnabled('fullscreen') && <Fullscreen />}
            {isEnabled('collapse') && <Collapse toggleMenu={setIsMenuExpanded} />}
          </div>
        </div>

        {/* Menubar expand button */}
        {!isMenuExpanded && <Expand toggleMenu={setIsMenuExpanded} />}
      </div>
    </Draggable>
  );
};
