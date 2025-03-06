import { KeyboardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MenuItem } from '@/components/menu-item.tsx';

import { CtrlAltDel } from './ctrl-alt-del.tsx';
import { Paste } from './paste.tsx';
import { VirtualKeyboard } from './virtual-keyboard.tsx';

export const Keyboard = () => {
  const { t } = useTranslation();

  return (
    <MenuItem
      title={t('keyboard.title')}
      icon={<KeyboardIcon size={18} />}
      content={
        <>
          <Paste />
          <VirtualKeyboard />
          <CtrlAltDel />
        </>
      }
    />
  );
};
