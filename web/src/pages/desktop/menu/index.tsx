import { useEffect, useRef, useState } from 'react';
import { Divider } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { GripVerticalIcon } from 'lucide-react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

import { menuDisabledItemsAtom } from '@/jotai/settings.ts';
import { useMenuBounds } from '@/hooks/useMenuBounds.ts';
import { useMenuVisibility } from '@/hooks/useMenuVisibility.ts';
import { useMenuSnap, SNAP_PEEK, SNAP_HOVER_ZONE } from '@/hooks/useMenuSnap.ts';

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

  // Track the last drag position so we can restore it after unsnapping
  const savedPosRef = useRef({ x: 0, y: 0 });
  // Incrementing this key forces the Draggable to re-mount at savedPosRef
  const [unSnapKey, setUnSnapKey] = useState(0);

  const menuDisabledItems = useAtomValue(menuDisabledItemsAtom);

  const {
    isInitialized,
    isMenuExpanded,
    isMenuHidden,
    handleHovered,
    handleMoved,
    setIsMenuExpanded
  } = useMenuVisibility();

  const menuBounds = useMenuBounds(nodeRef, isMenuExpanded);
  const { snapState, isSnapHovered, onDragStop, setSnapHovered, clearSnap } = useMenuSnap();

  const isSnapped = snapState.edge !== null;
  const edge = snapState.edge;

  // Ref to measure the popped-out panel's actual rendered size
  const snapPanelRef = useRef<HTMLDivElement>(null);
  // Clamped normalised offset so the panel never goes off-screen
  const [clampedOffset, setClampedOffset] = useState(snapState.offset);

  useEffect(() => {
    if (!isSnapped) return;
    const el = snapPanelRef.current;
    if (!el) return;

    const isHorizontal = edge === 'top' || edge === 'bottom';
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (isHorizontal) {
      const halfW = el.offsetWidth / 2;
      const raw = snapState.offset * vw;
      const clamped = Math.max(halfW + 4, Math.min(vw - halfW - 4, raw));
      setClampedOffset(clamped / vw);
    } else {
      const halfH = el.offsetHeight / 2;
      const raw = snapState.offset * vh;
      const clamped = Math.max(halfH + 4, Math.min(vh - halfH - 4, raw));
      setClampedOffset(clamped / vh);
    }
  }, [isSnapped, edge, snapState.offset, isSnapHovered]);

  function handleDragStop(_e: DraggableEvent, data: DraggableData) {
    // Always save position so we can restore it on unsnap
    savedPosRef.current = { x: data.x, y: data.y };
    if (data.x === 0 && data.y === 0) return;
    onDragStop(nodeRef);
    handleMoved();
  }

  // Clear snap and re-mount Draggable at the last known position (near the snap edge)
  function handleClearSnap() {
    clearSnap();
    setUnSnapKey((k) => k + 1);
  }

  // Handles both click and drag on the grip while snapped.
  // Moving >= 25px = drag to release; mouseup without movement = click to release.
  function startGripDrag(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let unsnapped = false;

    function onMove(ev: MouseEvent) {
      if (unsnapped) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > 25) {
        unsnapped = true;
        cleanup();
        handleClearSnap();
      }
    }

    function onUp() {
      cleanup();
      if (!unsnapped) {
        handleClearSnap();
      }
    }

    function cleanup() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function isEnabled(item: string) {
    return !menuDisabledItems.includes(item);
  }

  // Shared menu items renderer
  function renderMenuItems(isHorizontal: boolean) {
    const divider = (
      <Divider
        type={isHorizontal ? 'vertical' : 'horizontal'}
        style={{ margin: isHorizontal ? '0' : '4px 0' }}
      />
    );
    return (
      <>
        <Screen />
        <Keyboard />
        <Mouse />
        {divider}

        {isEnabled('image') && <Image />}
        {isEnabled('download') && <DownloadImage />}
        {isEnabled('script') && <Script />}
        {isEnabled('terminal') && <Terminal />}
        {isEnabled('wol') && <Wol />}

        {['image', 'download', 'script', 'terminal', 'wol'].some(isEnabled) && divider}

        {isEnabled('picoclaw') && (
          <>
            <Picoclaw />
            {divider}
          </>
        )}

        {isEnabled('power') && (
          <>
            <Power />
            {divider}
          </>
        )}

        <Settings />
        {isEnabled('fullscreen') && <Fullscreen />}
        {isEnabled('collapse') && <Collapse toggleMenu={setIsMenuExpanded} />}
      </>
    );
  }

  // ---- Snapped mode ----
  if (isSnapped) {
    const isHorizontal = edge === 'top' || edge === 'bottom';
    // Use clamped offset so panel stays within viewport
    const offsetPct = `${clampedOffset * 100}%`;

    // Full-edge hover trigger strip.
    // pointerEvents is disabled when panel is visible so the panel (zIndex 1002) can receive clicks.
    const stripStyle: React.CSSProperties = isHorizontal
      ? {
          position: 'fixed',
          [edge!]: 0,
          left: 0,
          right: 0,
          height: SNAP_HOVER_ZONE,
          zIndex: 1001,
          pointerEvents: isSnapHovered ? 'none' : 'auto',
          cursor: 'pointer'
        }
      : {
          position: 'fixed',
          [edge!]: 0,
          top: 0,
          bottom: 0,
          width: SNAP_HOVER_ZONE,
          zIndex: 1001,
          pointerEvents: isSnapHovered ? 'none' : 'auto',
          cursor: 'pointer'
        };

    // Visible indicator pill
    const pillStyle: React.CSSProperties = isHorizontal
      ? {
          position: 'absolute',
          [edge!]: 0,
          left: `calc(${offsetPct} - 40px)`,
          width: 80,
          height: SNAP_PEEK,
          borderRadius: edge === 'top' ? '0 0 4px 4px' : '4px 4px 0 0',
          background: 'rgba(200,200,200,0.55)',
          transition: 'opacity 0.2s',
          opacity: isSnapHovered ? 0.9 : 0.5,
          pointerEvents: 'none'
        }
      : {
          position: 'absolute',
          [edge!]: 0,
          top: `calc(${offsetPct} - 20px)`,
          height: 40,
          width: SNAP_PEEK,
          borderRadius: edge === 'left' ? '0 4px 4px 0' : '4px 0 0 4px',
          background: 'rgba(200,200,200,0.55)',
          transition: 'opacity 0.2s',
          opacity: isSnapHovered ? 0.9 : 0.5,
          pointerEvents: 'none'
        };

    // Panel sits above strip (zIndex 1002).
    // Hidden state uses opacity+visibility ONLY — no off-screen translate,
    // which would push the element beyond the viewport and trigger scrollbars.
    const panelHidden: React.CSSProperties = {
      opacity: 0,
      visibility: 'hidden' as const,
      pointerEvents: 'none' as const
    };
    const panelVisible: React.CSSProperties = {
      opacity: 1,
      visibility: 'visible' as const
    };

    const menuPanelStyle: React.CSSProperties = isHorizontal
      ? {
          position: 'fixed',
          [edge!]: 0,
          left: offsetPct,
          transform: 'translateX(-50%)',
          zIndex: 1002,
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
          ...(isSnapHovered ? panelVisible : panelHidden)
        }
      : {
          position: 'fixed',
          [edge!]: 0,
          top: offsetPct,
          transform: 'translateY(-50%)',
          zIndex: 1002,
          maxHeight: 'calc(100dvh - 8px)',
          overflowY: 'hidden' as const,
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
          ...(isSnapHovered ? panelVisible : panelHidden)
        };

    return (
      <>
        {/* Hover trigger strip */}
        <div style={stripStyle} onMouseEnter={() => setSnapHovered(true)}>
          <div style={pillStyle} />
        </div>

        {/* Pop-out menu panel */}
        <div
          ref={snapPanelRef}
          style={menuPanelStyle}
          onMouseEnter={() => setSnapHovered(true)}
          onMouseLeave={() => setSnapHovered(false)}
        >
          <div
            className={clsx(
              'flex items-center rounded bg-neutral-800/80 transition-all',
              isHorizontal ? 'h-[36px] flex-row pl-1 pr-2' : 'w-[36px] flex-col py-1 px-0'
            )}
          >
            {/* Grip — click or drag to unsnap, menu re-appears near the snap edge */}
            <div
              className="flex cursor-move select-none items-center justify-center px-1 text-neutral-500 hover:text-white"
              title="拖动或点击可解除吸附"
              onMouseDown={startGripDrag}
            >
              <GripVerticalIcon size={18} />
            </div>

            <Divider
              type={isHorizontal ? 'vertical' : 'horizontal'}
              style={{ margin: isHorizontal ? '0' : '4px 0' }}
            />

            {renderMenuItems(isHorizontal)}
          </div>
        </div>
      </>
    );
  }

  // ---- Normal floating mode ----
  return (
    <Draggable
      key={unSnapKey}
      nodeRef={nodeRef}
      bounds={menuBounds}
      handle="strong"
      positionOffset={{ x: '-50%', y: '0%' }}
      defaultPosition={savedPosRef.current}
      onStop={handleDragStop}
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
        {/* Trigger area for auto-show when hidden */}
        {isMenuExpanded && (
          <div className="absolute -top-[10px] left-0 right-0 h-[46px] w-full bg-transparent" />
        )}

        {/* Menubar */}
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

            {renderMenuItems(true)}
          </div>
        </div>

        {/* Menubar expand button */}
        {!isMenuExpanded && <Expand toggleMenu={setIsMenuExpanded} />}
      </div>
    </Draggable>
  );
};
