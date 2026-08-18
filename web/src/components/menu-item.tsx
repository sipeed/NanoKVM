import {
  cloneElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react';
import { Popover, Tooltip, type PopoverProps } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import { ChevronLeftIcon, XIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import { submenuOpenCountAtom } from '@/jotai/settings.ts';

import {
  MobileMenuItemContext,
  MobileMenuNavigationContext,
  type MobileMenuItemContextValue,
  type MobileMenuNavigationContextValue,
  type MobileMenuNavigationEntry
} from './mobile-menu-context.ts';

const desktopMenuPopoverZIndex = 999;

export const MobileMenuItemProvider = ({
  children,
  mobilePlacement,
  mobilePopoverClassName,
  dismissMenuKey,
  onRequestMobileMenuDismiss
}: MobileMenuItemContextValue & { children: ReactNode }) => (
  <MobileMenuItemContext.Provider
    value={{ mobilePlacement, mobilePopoverClassName, dismissMenuKey, onRequestMobileMenuDismiss }}
  >
    {children}
  </MobileMenuItemContext.Provider>
);

const MobileMenuPanel = ({
  content,
  open,
  onClose
}: {
  content: ReactNode;
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [activePath, setActivePath] = useState<MobileMenuNavigationEntry[]>([]);
  const activePathRef = useRef<MobileMenuNavigationEntry[]>([]);
  const [layerHost, setLayerHost] = useState<HTMLDivElement | null>(null);
  const reset = useCallback((notify = false) => {
    if (notify) [...activePathRef.current].reverse().forEach((entry) => entry.onDismiss?.());
    activePathRef.current = [];
    setActivePath([]);
  }, []);
  useEffect(() => {
    if (!open) reset(true);
  }, [open, reset]);
  const push = useCallback((entry: MobileMenuNavigationEntry) => {
    const current = activePathRef.current;
    const index = current.findIndex((item) => item.id === entry.id);
    const next = index === -1 ? [...current, entry] : current.slice(0, index + 1);
    current
      .slice(index + 1)
      .reverse()
      .forEach((item) => item.onDismiss?.());
    activePathRef.current = next;
    setActivePath(next);
  }, []);
  const pop = useCallback(() => {
    const active = activePathRef.current[activePathRef.current.length - 1];
    if (!active || active.canLeave?.() === false) return;
    active.onDismiss?.();
    const next = activePathRef.current.slice(0, -1);
    activePathRef.current = next;
    setActivePath(next);
  }, []);
  const close = useCallback(() => {
    if (activePathRef.current[activePathRef.current.length - 1]?.canLeave?.() === false) return;
    reset(true);
    onClose();
  }, [onClose, reset]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [close, open]);
  const navigation = useMemo<MobileMenuNavigationContextValue>(
    () => ({ activePath, layerHost, push, pop, close }),
    [activePath, close, layerHost, pop, push]
  );
  const activeEntry = activePath[activePath.length - 1];
  return (
    <MobileMenuNavigationContext.Provider value={navigation}>
      <div className="nanokvm-mobile-menu-panel">
        {activeEntry && (
          <div className="flex h-8 min-w-0 items-center border-b border-neutral-700/80 px-1">
            <button
              type="button"
              className="nanokvm-button-base flex size-[30px] shrink-0 items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
              onClick={pop}
              aria-label={t('settings.back')}
            >
              <ChevronLeftIcon size={18} />
            </button>
            <span className="min-w-0 flex-1 truncate px-2 text-sm text-neutral-100">
              {activeEntry.title}
            </span>
            <button
              type="button"
              className="nanokvm-button-base flex size-[30px] shrink-0 items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
              onClick={close}
              aria-label={t('settings.close')}
            >
              <XIcon size={17} />
            </button>
          </div>
        )}
        <div className="nanokvm-mobile-menu-panel__body">
          <div
            className={clsx(
              'nanokvm-mobile-menu-panel__root',
              activeEntry && 'pointer-events-none invisible'
            )}
            aria-hidden={activeEntry ? true : undefined}
          >
            {content}
          </div>
          <div ref={setLayerHost} className="contents" />
        </div>
      </div>
    </MobileMenuNavigationContext.Provider>
  );
};

type MenuSubmenuProps = {
  title: string;
  content: ReactNode;
  children: ReactElement;
  popoverProps?: Omit<PopoverProps, 'children' | 'content'>;
  onBeforeLeave?: () => boolean;
};
export const MenuSubmenu = ({
  title,
  content,
  children,
  popoverProps,
  onBeforeLeave
}: MenuSubmenuProps) => {
  const navigation = useContext(MobileMenuNavigationContext);
  const id = useId();
  const openRef = useRef(popoverProps?.onOpenChange);
  const leaveRef = useRef(onBeforeLeave);
  useEffect(() => {
    openRef.current = popoverProps?.onOpenChange;
  }, [popoverProps?.onOpenChange]);
  useEffect(() => {
    leaveRef.current = onBeforeLeave;
  }, [onBeforeLeave]);
  const dismiss = useCallback(() => openRef.current?.(false), []);
  const openSubmenu = useCallback(() => {
    openRef.current?.(true);
    navigation?.push({
      id,
      title,
      canLeave: () => leaveRef.current?.() !== false,
      onDismiss: dismiss
    });
  }, [dismiss, id, navigation, title]);
  if (!navigation)
    return (
      <Popover content={content} {...popoverProps}>
        {children}
      </Popover>
    );
  const active = navigation.activePath[navigation.activePath.length - 1]?.id === id;
  const inPath = navigation.activePath.some((entry) => entry.id === id);
  const trigger = cloneElement(children, {
    role: children.props.role ?? 'button',
    tabIndex: children.props.tabIndex ?? 0,
    'aria-haspopup': 'dialog',
    'aria-expanded': active,
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      children.props.onClick?.(event);
      if (!event.defaultPrevented) openSubmenu();
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      children.props.onKeyDown?.(event);
      if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        openSubmenu();
      }
    }
  });
  return (
    <>
      {trigger}
      {inPath && navigation.layerHost
        ? createPortal(
            <div
              className={clsx(
                'nanokvm-mobile-menu-panel__layer',
                !active && 'pointer-events-none invisible'
              )}
              aria-hidden={!active}
            >
              {content}
            </div>,
            navigation.layerHost
          )
        : null}
    </>
  );
};

type MenuItemProps = {
  title: string;
  icon: ReactNode;
  content: ReactNode;
  className?: string;
  disabled?: boolean;
  fresh?: boolean;
  mobilePlacement?: 'left' | 'right';
  mobilePopoverClassName?: string;
  onOpenChange?: (open: boolean) => void;
};
export const MenuItem = ({
  title,
  icon,
  content,
  className,
  disabled = false,
  fresh,
  mobilePlacement,
  mobilePopoverClassName,
  onOpenChange
}: MenuItemProps) => {
  const isBigScreen = useMediaQuery({ minWidth: 640 });
  const setCount = useSetAtom(submenuOpenCountAtom);
  const context = useContext(MobileMenuItemContext);
  const placement = mobilePlacement ?? context.mobilePlacement;
  const overlay = mobilePopoverClassName ?? context.mobilePopoverClassName;
  const [isOpen, setIsOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const previousDismiss = useRef(context.dismissMenuKey);
  const isOpenRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const close = useCallback(() => {
    if (!isOpenRef.current) return;
    isOpenRef.current = false;
    setIsTooltipOpen(false);
    setIsOpen(false);
    setCount((count) => Math.max(0, count - 1));
    onOpenChangeRef.current?.(false);
  }, [setCount]);
  useEffect(() => {
    if (disabled) close();
  }, [close, disabled]);
  useEffect(() => {
    if (context.dismissMenuKey !== previousDismiss.current) {
      previousDismiss.current = context.dismissMenuKey;
      close();
    }
  }, [close, context.dismissMenuKey]);

  useEffect(
    () => () => {
      if (!isOpenRef.current) return;
      isOpenRef.current = false;
      setCount((count) => Math.max(0, count - 1));
      onOpenChangeRef.current?.(false);
    },
    [setCount]
  );

  const toggle = (next: boolean) => {
    if (next === isOpenRef.current) return;
    isOpenRef.current = next;
    setIsTooltipOpen(false);
    setIsOpen(next);
    setCount((count) => (next ? count + 1 : Math.max(0, count - 1)));
    onOpenChangeRef.current?.(next);
  };
  const popoverPlacement = placement
    ? placement === 'right'
      ? 'leftTop'
      : 'rightTop'
    : isBigScreen
      ? 'bottomLeft'
      : 'bottom';
  const tooltipPlacement = placement ? (placement === 'right' ? 'left' : 'right') : 'bottom';
  const triggerNode = (
    <Tooltip
      title={title}
      mouseEnterDelay={0.6}
      placement={tooltipPlacement}
      overlayClassName={overlay}
      open={disabled ? undefined : isTooltipOpen}
      onOpenChange={disabled ? undefined : (next) => !isOpen && setIsTooltipOpen(next)}
    >
      <div
        aria-disabled={disabled}
        className={clsx(
          'flex h-[30px] w-[30px] items-center justify-center rounded text-neutral-300',
          disabled
            ? 'cursor-not-allowed text-neutral-600 opacity-45'
            : 'cursor-pointer hover:bg-neutral-700/80 hover:text-white',
          className
        )}
      >
        {icon}
      </div>
    </Tooltip>
  );
  return disabled ? (
    triggerNode
  ) : (
    <Popover
      content={
        placement ? <MobileMenuPanel content={content} open={isOpen} onClose={close} /> : content
      }
      arrow={false}
      trigger="click"
      zIndex={placement ? 1100 : desktopMenuPopoverZIndex}
      placement={popoverPlacement}
      overlayClassName={overlay}
      open={isOpen}
      onOpenChange={toggle}
      fresh={!!fresh}
    >
      {triggerNode}
    </Popover>
  );
};
