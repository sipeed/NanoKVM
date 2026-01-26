import { Divider } from 'antd';
import { KeyboardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MenuItem } from '@/components/menu-item.tsx';

import { LeaderKey } from './leader-key.tsx';
import { Paste } from './paste.tsx';
import { Shortcuts } from './shortcuts';
import { VirtualKeyboard } from './virtual-keyboard.tsx';

export const Keyboard = () => {
  const { t } = useTranslation();

  const content = (
    <div className="flex flex-col space-y-1">
      <Paste />
      <VirtualKeyboard />
      <Shortcuts />

      <Divider style={{ margin: '5px 0', opacity: 0.5 }} />

      <LeaderKey />
    </div>
  );

  return (
    <MenuItem title={t('keyboard.title')} icon={<KeyboardIcon size={18} />} content={content} />
  );
};
