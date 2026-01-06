import { KeyboardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MenuItem } from '@/components/menu-item.tsx';

import { Paste } from './paste.tsx';
import { Shortcuts } from './shortcuts';
import { VirtualKeyboard } from './virtual-keyboard.tsx';

export const Keyboard = () => {
  const { t } = useTranslation();

  return (
    <MenuItem
      title={t('keyboard.title')}
      icon={<KeyboardIcon size={18} />}
      content={
        <div className="flex flex-col space-y-1">
          <Paste />
          <VirtualKeyboard />
          <Shortcuts />
        </div>
      }
    />
  );
};
