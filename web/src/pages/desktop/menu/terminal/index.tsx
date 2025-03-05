import { useState } from 'react';
import { Divider, Popover, Tooltip } from 'antd';
import { SquareTerminalIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Nanokvm } from './nanokvm';
import { SerialPort } from './serial-port';

export const Terminal = () => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const tooltip = t('terminal.title');
  const [tooltipValue, setTooltipValue] = useState(tooltip);

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
      placement="bottomLeft"
      trigger="click"
      arrow={false}
      open={isPopoverOpen}
      onOpenChange={(visible) => {
        setIsPopoverOpen(visible);
        setTooltipValue(visible ? '' : tooltip);
      }}
    >
      <Tooltip title={tooltipValue} placement="bottom">
        <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white">
          <SquareTerminalIcon size={18} />
        </div>
      </Tooltip>
    </Popover>
  );
};
