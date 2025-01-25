import { useState } from 'react';
import { Popover } from 'antd';
import { KeyboardIcon } from 'lucide-react';

import { Paste } from './paste.tsx';
import { VirtualKeyboard } from './virtual-keyboard.tsx';
import { CtrlAltDel } from './ctrl-alt-del.tsx';

export const Keyboard = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
      onOpenChange={setIsPopoverOpen}
    >
      <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white">
        <KeyboardIcon size={18} />
      </div>
    </Popover>
  );
};
