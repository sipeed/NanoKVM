import { useState } from 'react';
import { Popover } from 'antd';
import { KeyboardIcon } from 'lucide-react';

import { Paste } from './paste.tsx';
import { VirtualKeyboard } from './virtual-keyboard.tsx';

export const Keyboard = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const content = (
    <>
      <Paste setIsPopoverOpen={setIsPopoverOpen} />
      <VirtualKeyboard />
    </>
  );

  return (
    <Popover
      content={content}
      placement="bottomLeft"
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <div className="flex h-[30px] cursor-pointer items-center rounded px-2 text-neutral-300 hover:bg-neutral-700">
        <KeyboardIcon size={18} />
      </div>
    </Popover>
  );
};
