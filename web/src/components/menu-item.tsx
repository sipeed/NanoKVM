import { ReactNode, useState } from 'react';
import { Popover, Tooltip } from 'antd';
import { useSetAtom } from 'jotai';
import { useMediaQuery } from 'react-responsive';

import { submenuOpenCountAtom } from '@/jotai/settings.ts';

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
  const isBigScreen = useMediaQuery({ minWidth: 640 });
  const setSubmenuOpenCount = useSetAtom(submenuOpenCountAtom);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

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
