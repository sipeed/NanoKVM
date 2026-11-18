import { useState } from 'react';
import { Divider } from 'antd';
import { SquareTerminalIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MenuItem } from '@/components/menu-item.tsx';

import { Nanokvm } from './nanokvm';
import { TerminalSessionPicker } from './picker';
import { SerialPort } from './serial-port';

export const Terminal = () => {
  const { t } = useTranslation();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [closeRequest, setCloseRequest] = useState(0);

  function openPicker() {
    // Hand over from the menu popover to the picker modal without collapsing
    // the menu bar.
    setCloseRequest((request) => request + 1);
    setIsPickerOpen(true);
  }

  const content = (
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-base font-bold text-neutral-300">{t('terminal.title')}</span>
      </div>

      <Divider style={{ margin: '10px 0 15px 0' }} />

      <Nanokvm onOpen={openPicker} />
      <SerialPort />
    </div>
  );

  return (
    <>
      <MenuItem
        title={t('terminal.title')}
        icon={<SquareTerminalIcon size={18} />}
        content={content}
        closeRequest={closeRequest}
      />

      <TerminalSessionPicker open={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </>
  );
};
