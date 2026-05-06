import { useRef } from 'react';
import { Divider } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { GripVerticalIcon } from 'lucide-react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

import { menuDisabledItemsAtom } from '@/jotai/settings.ts';
import { useMenuBounds } from '@/hooks/useMenuBounds.ts';
import { useMenuVisibility } from '@/hooks/useMenuVisibility.ts';
import { useRole } from '@/hooks/useRole.ts';

import { DownloadImage } from './download.tsx';
import { Fullscreen } from './fullscreen';
import { Image } from './image';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';
import { Collapse, Expand } from './operations';
import { Picoclaw } from './picoclaw';
import { Power } from './power';
import { Screen } from './screen';
import { Script } from './script';
import { Settings } from './settings';
import { Terminal } from './terminal';
import { Wol } from './wol';

export const Menu = () => {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const menuDisabledItems = useAtomValue(menuDisabledItemsAtom);
  const { isOperator, isAdmin } = useRole();

  const {
    isInitialized,
    isMenuExpanded,
    isMenuHidden,
    handleHovered,
    handleMoved,
    setIsMenuExpanded
  } = useMenuVisibility();

  const menuBounds = useMenuBounds(nodeRef, isMenuExpanded);

  function onDragStop(_e: DraggableEvent, data: DraggableData) {
    if (data.x === 0 && data.y === 0) return;
    handleMoved();
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
      onStop={onDragStop}
    >
      <div
        ref={nodeRef}
        className={clsx(
          'fixed left-1/2 top-[10px] z-[1000] -translate-x-1/2 transition-opacity duration-300',
          isInitialized ? 'opacity-100' : 'opacity-0'
        )}
        onMouseEnter={() => handleHovered(true)}
        onMouseLeave={() => handleHovered(false)}
        onBlur={() => handleHovered(false)}
      >
        {isMenuExpanded && (
          <div className="absolute -top-[10px] left-0 right-0 h-[46px] w-full bg-transparent" />
        )}

        <div className="sticky top-[10px] flex w-full justify-center">
          <div
            className={clsx(
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

            {/* Screen immer sichtbar (nur Anzeige) */}
            <Screen />

            {/* Tastatur & Maus: nur operator+ */}
            {isOperator && <Keyboard />}
            {isOperator && <Mouse />}

            <Divider type="vertical" />

            {/* Image/Download: alle */}
            {isEnabled('image') && <Image />}
            {isEnabled('download') && <DownloadImage />}

            {/* Script & Terminal: nur operator+ */}
            {isOperator && isEnabled('script') && <Script />}
            {isOperator && isEnabled('terminal') && <Terminal />}

            {/* WoL: nur admin */}
            {isAdmin && isEnabled('wol') && <Wol />}

            {['image', 'download'].some(isEnabled) && (
              <Divider type="vertical" />
            )}

            {/* Picoclaw: nur admin */}
            {isAdmin && isEnabled('picoclaw') && (
              <>
                <Picoclaw />
                <Divider type="vertical" />
              </>
            )}

            {/* Power/GPIO: nur operator+ */}
            {isOperator && isEnabled('power') && (
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

        {!isMenuExpanded && <Expand toggleMenu={setIsMenuExpanded} />}
      </div>
    </Draggable>
  );
};
