import { useState } from 'react';
import { Popover, Tooltip } from 'antd';
import { KeyboardIcon } from 'lucide-react';
import { t } from 'i18next';

import { Paste } from './paste.tsx';
import { VirtualKeyboard } from './virtual-keyboard.tsx';
import { CtrlAltDel } from './ctrl-alt-del.tsx';


export const Keyboard = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const tooltip = t('keyboard.title')
  const [tooltipValue, setTooltipValue] = useState(tooltip);

  const content = (
    <>
      <Paste setIsPopoverOpen={setIsPopoverOpen} />
      <VirtualKeyboard />
      <CtrlAltDel />
    </>
  );

  return (
    <Popover
      content={content}
      placement="bottomLeft"
      trigger="click"
      arrow={false}
      open={isPopoverOpen}
      onOpenChange={(visible) => {
        setIsPopoverOpen(visible);
        setTooltipValue(visible ? "" : tooltip);
      }}
    >
      <Tooltip title={tooltipValue} placement="bottom">
        <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white">
          <KeyboardIcon size={18} />
        </div>
      </Tooltip>
    </Popover>
  );
};
