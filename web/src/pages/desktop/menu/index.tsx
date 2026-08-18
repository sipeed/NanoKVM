import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Button, Divider } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon } from 'lucide-react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useTranslation } from 'react-i18next';

import { clampMobileMenuTop, MobileMenuEdge } from '@/lib/mobile-layout.ts';
import { keyboardLedStatusVisibleAtom, menuDisabledItemsAtom } from '@/jotai/settings.ts';
import { useMenuBounds } from '@/hooks/useMenuBounds.ts';
import { useMenuVisibility } from '@/hooks/useMenuVisibility.ts';
import { useMobileMenuPlacement } from '@/hooks/useMobileMenuPlacement.ts';
import { useResponsiveDevice } from '@/hooks/useResponsiveDevice.ts';
import { MobileMenuItemProvider } from '@/components/menu-item.tsx';

import { KeyboardLedStatus } from '../keyboard-led-status';
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

const mobileRailToggleButtonClass =
  '!flex !size-[30px] !min-w-[30px] touch-manipulation !items-center !justify-center !p-0 text-neutral-300 transition-colors hover:!bg-neutral-700/80 hover:!text-white active:!bg-neutral-600/70';

const mobileMenuPopoverClassName = 'nanokvm-mobile-menu-popover';

type MenuVariant = 'desktop' | 'mobile';

export const Menu = () => {
  const { t } = useTranslation();
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mobileRailRef = useRef<HTMLDivElement | null>(null);

  const menuDisabledItems = useAtomValue(menuDisabledItemsAtom);
  const isKeyboardLedStatusVisible = useAtomValue(keyboardLedStatusVisibleAtom);
  const [isMobileRailCollapsed, setIsMobileRailCollapsed] = useState(false);
  const [mobileRailOffset, setMobileRailOffset] = useState({ x: 0, y: 0 });
  const [dismissMenuKey, setDismissMenuKey] = useState(0);

  const {
    isInitialized,
    isMenuExpanded,
    isMenuHidden,
    handleHovered,
    handleMoved,
    setIsMenuExpanded
  } = useMenuVisibility();

  const menuBounds = useMenuBounds(nodeRef, isMenuExpanded);
  const responsiveDevice = useResponsiveDevice();
  const isMobileRailActive = responsiveDevice.isMobilePortrait;
  const isTouchLandscapeMenu =
    responsiveDevice.isTouchLikeDevice && responsiveDevice.isLandscapeViewport;
  const { placement, updatePlacement } = useMobileMenuPlacement();

  function onDragStop(_e: DraggableEvent, data: DraggableData) {
    if (data.x === 0 && data.y === 0) return;
    handleMoved();
  }

  function onMobileDrag(_e: DraggableEvent, data: DraggableData) {
    setMobileRailOffset({ x: data.x, y: data.y });
  }

  const dismissMenus = useCallback(() => {
    setDismissMenuKey((key) => key + 1);
  }, []);

  function onMenuDragStart() {
    dismissMenus();
  }

  function onMobileDragStop(_e: DraggableEvent, data: DraggableData) {
    setMobileRailOffset({ x: 0, y: 0 });
    if (data.x === 0 && data.y === 0) return;

    const railRect = mobileRailRef.current?.getBoundingClientRect();
    const railWidth = railRect?.width ?? 0;
    const railHeight = railRect?.height ?? 480;
    const left =
      railRect?.left ?? (placement.edge === 'left' ? 0 : window.innerWidth - railWidth) + data.x;
    const top = railRect?.top ?? placement.top + data.y;
    const edge: MobileMenuEdge = left + railWidth / 2 < window.innerWidth / 2 ? 'left' : 'right';

    updatePlacement(edge, clampMobileMenuTop(top, window.innerHeight, railHeight));
  }

  function isEnabled(item: string) {
    return !menuDisabledItems.includes(item);
  }

  function renderDivider(variant: MenuVariant, key: string) {
    if (variant === 'mobile') {
      return <div key={key} className="my-1 h-px w-7 shrink-0 bg-neutral-600/60" />;
    }

    return <Divider key={key} type="vertical" />;
  }

  function renderMenuItems(variant: MenuVariant): ReactNode[] {
    const items: ReactNode[] = [];
    const tooltipPlacement =
      variant === 'mobile' ? (placement.edge === 'right' ? 'left' : 'right') : 'bottom';

    items.push(<Screen key="screen" />);
    items.push(<Keyboard key="keyboard" />);
    items.push(<Mouse key="mouse" />);
    items.push(renderDivider(variant, 'divider-input'));

    if (isEnabled('image')) {
      items.push(<Image key="image" tooltipPlacement={tooltipPlacement} />);
    }
    if (isEnabled('download')) items.push(<DownloadImage key="download" />);
    if (isEnabled('terminal')) items.push(<Terminal key="terminal" />);
    if (isEnabled('script')) items.push(<Script key="script" />);
    if (isEnabled('wol')) items.push(<Wol key="wol" />);

    if (['image', 'download', 'script', 'terminal', 'wol'].some(isEnabled)) {
      items.push(renderDivider(variant, 'divider-tools'));
    }

    if (isEnabled('picoclaw')) {
      items.push(<Picoclaw key="picoclaw" tooltipPlacement={tooltipPlacement} />);
      items.push(renderDivider(variant, 'divider-picoclaw'));
    }

    if (isEnabled('power')) {
      items.push(<Power key="power" />);
      items.push(renderDivider(variant, 'divider-power'));
    }

    if (variant === 'mobile') {
      items.push(<Settings key="settings" tooltipPlacement={tooltipPlacement} />);
    } else {
      // The fixed controls render their own separator outside the scroll area.
      items.pop();
    }

    return items;
  }

  if (isMobileRailActive) {
    const sideClass = placement.edge === 'left' ? 'left-2' : 'right-2';

    return (
      <Draggable
        key="mobile-menu"
        nodeRef={mobileRailRef}
        handle="strong"
        position={mobileRailOffset}
        onStart={onMenuDragStart}
        onDrag={onMobileDrag}
        onStop={onMobileDragStop}
      >
        <div
          ref={mobileRailRef}
          className={clsx(
            'fixed z-[1000] transition-opacity duration-300',
            sideClass,
            isInitialized ? 'opacity-100' : 'opacity-0'
          )}
          style={{ top: placement.top }}
        >
          <MobileMenuItemProvider
            mobilePlacement={placement.edge}
            mobilePopoverClassName={mobileMenuPopoverClassName}
            dismissMenuKey={dismissMenuKey}
            onRequestMobileMenuDismiss={dismissMenus}
          >
            {isMobileRailCollapsed ? (
              <div className="flex flex-col items-center rounded-full bg-neutral-800/90 p-1 shadow-lg shadow-black/30 outline outline-1 outline-neutral-700/80 backdrop-blur">
                <strong>
                  <div className="flex size-[28px] cursor-move select-none items-center justify-center rounded-full text-neutral-500">
                    <GripVerticalIcon size={18} />
                  </div>
                </strong>
                <Button
                  type="text"
                  className={clsx(mobileRailToggleButtonClass, 'rounded-full')}
                  onClick={() => setIsMobileRailCollapsed(false)}
                  aria-label={t('menu.expand')}
                  icon={<ChevronDownIcon size={18} aria-hidden="true" />}
                />
              </div>
            ) : (
              <div className="flex max-h-[calc(100dvh-96px)] flex-col items-center overflow-y-auto rounded bg-neutral-800/90 px-1 py-1 shadow-lg shadow-black/30 outline outline-1 outline-neutral-700/80 backdrop-blur transition-all duration-200 [&>*]:shrink-0">
                <strong>
                  <div className="flex size-[30px] cursor-move select-none items-center justify-center rounded text-neutral-500">
                    <GripVerticalIcon size={18} />
                  </div>
                </strong>

                {renderDivider('mobile', 'divider-handle')}
                {renderMenuItems('mobile')}

                {isEnabled('collapse') && (
                  <>
                    {renderDivider('mobile', 'divider-collapse')}
                    <Button
                      type="text"
                      className={clsx(mobileRailToggleButtonClass, 'shrink-0 rounded')}
                      onClick={() => setIsMobileRailCollapsed(true)}
                      aria-label={t('menu.collapse')}
                      icon={<ChevronUpIcon size={18} aria-hidden="true" />}
                    />
                  </>
                )}
              </div>
            )}
          </MobileMenuItemProvider>
        </div>
      </Draggable>
    );
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds={menuBounds}
      handle="strong"
      onStart={onMenuDragStart}
      onStop={onDragStop}
    >
      <div
        ref={nodeRef}
        className={clsx(
          'pointer-events-none fixed left-1/2 top-[10px] z-[1000] w-max transition-opacity duration-300',
          isInitialized ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div
          className="relative -translate-x-1/2"
          onMouseEnter={() => handleHovered(true)}
          onMouseLeave={() => handleHovered(false)}
          onFocus={() => handleHovered(true)}
          onBlur={() => handleHovered(false)}
        >
          {isMenuExpanded && (
            <Button
              type="text"
              aria-label={t('menu.expand')}
              className={clsx(
                'absolute z-10 !p-0 transition-all duration-300',
                isTouchLandscapeMenu
                  ? 'left-1/2 top-0 !flex !h-6 !w-16 !min-w-16 -translate-x-1/2 !items-center !justify-center !rounded-b !bg-neutral-800/80 text-neutral-300 shadow-lg shadow-black/30 backdrop-blur'
                  : '-top-[10px] left-0 !h-[46px] !w-full !bg-transparent',
                isMenuHidden ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              )}
              onPointerDown={(event) => {
                handleHovered(true);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                handleHovered(false);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              onPointerCancel={(event) => {
                handleHovered(false);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
            >
              {isTouchLandscapeMenu && <ChevronDownIcon size={16} aria-hidden="true" />}
            </Button>
          )}

          <div className="sticky top-[10px] flex w-full justify-center">
            <div
              className={clsx(
                'pointer-events-auto h-[36px] max-w-[calc(100vw-16px)] items-center rounded bg-neutral-800/80 pl-1 pr-2 transition-all duration-300',
                isMenuExpanded ? 'flex' : 'hidden',
                isMenuHidden ? '-translate-y-[110%] opacity-80' : 'translate-y-0 opacity-100'
              )}
            >
              {isMenuExpanded && isKeyboardLedStatusVisible && !isTouchLandscapeMenu && (
                <div
                  className={clsx(
                    'absolute inset-y-0 right-full mr-1 transition-all duration-300',
                    isMenuHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
                  )}
                >
                  <KeyboardLedStatus />
                </div>
              )}
              <strong className="shrink-0">
                <div className="flex h-[30px] cursor-move select-none items-center justify-center pl-1 text-neutral-500">
                  <GripVerticalIcon size={18} />
                </div>
              </strong>
              <Divider type="vertical" className="shrink-0" />

              <MobileMenuItemProvider dismissMenuKey={dismissMenuKey}>
                <div className="nanokvm-mobile-menu-rail flex min-w-0 items-center overflow-x-auto [&>*]:shrink-0">
                  {renderMenuItems('desktop')}
                </div>
                <Divider type="vertical" className="shrink-0" />
                <Settings />
                {isEnabled('fullscreen') && <Fullscreen />}
                {isEnabled('collapse') && <Collapse toggleMenu={setIsMenuExpanded} />}
              </MobileMenuItemProvider>
            </div>
          </div>

          {!isMenuExpanded && (
            <div className="pointer-events-auto inline-flex w-max">
              <Expand toggleMenu={setIsMenuExpanded} />
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};
