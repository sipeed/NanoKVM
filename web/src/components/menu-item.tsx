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
};

export const MenuItem = ({
  title,
  icon,
  content,
  className,
  fresh,
  onOpenChange
}: MenuItemProps) => {
  const isBigScreen = useMediaQuery({ minWidth: 850 });
  const setSubmenuOpenCount = useSetAtom(submenuOpenCountAtom);
  const menuCloseSignal = useAtomValue(menuCloseSignalAtom);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const handledCloseSignalRef = useRef(0);

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
        <button
          type="button"
          aria-label={title}
          aria-expanded={isPopoverOpen}
          className={
            className
              ? className
              : 'flex h-10 w-10 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-neutral-300 hover:bg-neutral-700/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 min-[850px]:h-[30px] min-[850px]:w-[30px]'
          }
        >
          {icon}
        </button>
      </Tooltip>
    </Popover>
  );
};
