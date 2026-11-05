import { ReactNode, useEffect, useRef, useState } from 'react';
import { Popover, Tooltip } from 'antd';
import { useAtomValue, useSetAtom } from 'jotai';
import { useMediaQuery } from 'react-responsive';

import { menuCloseSignalAtom, submenuOpenCountAtom } from '@/jotai/settings.ts';

type MenuItemProps = {
  title: string;
  icon: ReactNode;
  content: ReactNode;
  className?: string;
  fresh?: boolean;
  onOpenChange?: (open: boolean) => void;
  // A caller that opens its own window from inside the popover asks it to
  // close with this: the global close signal would also collapse the menu bar,
  // and a picker that hands over to a modal must not take the bar with it.
  closeRequest?: number;
};

export const MenuItem = ({
  title,
  icon,
  content,
  className,
  fresh,
  onOpenChange,
  closeRequest = 0
}: MenuItemProps) => {
  const isBigScreen = useMediaQuery({ minWidth: 640 });
  const setSubmenuOpenCount = useSetAtom(submenuOpenCountAtom);
  const menuCloseSignal = useAtomValue(menuCloseSignalAtom);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const handledCloseSignalRef = useRef(0);
  const handledCloseRequestRef = useRef(0);

  useEffect(() => {
    if (
      menuCloseSignal === 0 ||
      menuCloseSignal === handledCloseSignalRef.current ||
      !isPopoverOpen
    ) {
      return;
    }

    handledCloseSignalRef.current = menuCloseSignal;
    setIsPopoverOpen(false);
    setIsTooltipOpen(false);
    setSubmenuOpenCount((count) => Math.max(0, count - 1));
    onOpenChange?.(false);
  }, [isPopoverOpen, menuCloseSignal, onOpenChange, setSubmenuOpenCount]);

  useEffect(() => {
    if (closeRequest === 0 || closeRequest === handledCloseRequestRef.current || !isPopoverOpen) {
      return;
    }

    handledCloseRequestRef.current = closeRequest;
    setIsPopoverOpen(false);
    setIsTooltipOpen(false);
    setSubmenuOpenCount((count) => Math.max(0, count - 1));
    onOpenChange?.(false);
  }, [closeRequest, isPopoverOpen, onOpenChange, setSubmenuOpenCount]);

  function togglePopover(open: boolean) {
    setIsTooltipOpen(false);
    setIsPopoverOpen(open);

    // Update global submenu count
    setSubmenuOpenCount((count) => (open ? count + 1 : Math.max(0, count - 1)));

    if (onOpenChange) {
      onOpenChange(open);
    }
  }

  function toggleTooltip(open: boolean) {
    if (isPopoverOpen) {
      return;
    }
    setIsTooltipOpen(open);
  }

  return (
    <Popover
      content={content}
      arrow={false}
      trigger="click"
      placement={isBigScreen ? 'bottomLeft' : 'bottom'}
      open={isPopoverOpen}
      onOpenChange={togglePopover}
      fresh={!!fresh}
    >
      <Tooltip
        title={title}
        mouseEnterDelay={0.6}
        placement="bottom"
        open={isTooltipOpen}
        onOpenChange={toggleTooltip}
      >
        <div
          className={
            className
              ? className
              : 'flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white'
          }
        >
          {icon}
        </div>
      </Tooltip>
    </Popover>
  );
};
