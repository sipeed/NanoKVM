import { useState } from 'react';
import { Divider, Popover } from 'antd';
import { SquareTerminalIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Nanokvm } from './nanokvm';
import { SerialPort } from './serial-port';

export const Terminal = () => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const content = (
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-base font-bold text-neutral-300">{t('terminal.title')}</span>
      </div>

      <Divider style={{ margin: '10px 0 15px 0' }} />

      <Nanokvm setIsPopoverOpen={setIsPopoverOpen} />
      <SerialPort setIsPopoverOpen={setIsPopoverOpen} />
    </div>
  );

  return (
    <Popover
      content={content}
      placement="rightTop"
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <div className="flex h-[30px] cursor-pointer items-center justify-center rounded px-2 text-neutral-300 hover:bg-neutral-700">
        <SquareTerminalIcon size={18} />
      </div>
    </Popover>
  );
};
