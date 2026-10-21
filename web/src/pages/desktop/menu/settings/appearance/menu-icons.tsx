import { useAuth } from '@/contexts/auth.ts';
import { Switch } from 'antd';
import { useAtom } from 'jotai';
import {
  FileJsonIcon,
  HardDriveIcon,
  MaximizeIcon,
  NetworkIcon,
  PowerIcon,
  TerminalSquareIcon,
  XIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Permission } from '@/api/auth.ts';
import * as ls from '@/lib/localstorage.ts';
import { menuDisabledItemsAtom } from '@/jotai/settings.ts';
import { Robot } from '@/components/icons/robot.tsx';

export const MenuIcons = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [menuDisabledItems, setMenuDisabledItems] = useAtom(menuDisabledItemsAtom);

  type Item = {
    key: string;
    icon: React.ReactNode;
    label?: string;
    permission?: Permission;
  };

  const allItems: Item[] = [
    {
      key: 'storage',
      icon: <HardDriveIcon size={16} />,
      permission: 'library.read'
    },
    { key: 'terminal', icon: <TerminalSquareIcon size={16} />, permission: 'terminal' },
    { key: 'script', icon: <FileJsonIcon size={16} />, permission: 'terminal' },
    { key: 'wol', icon: <NetworkIcon size={16} />, permission: 'power' },
    { key: 'picoclaw', icon: <Robot size={16} />, permission: 'ai' },
    { key: 'power', icon: <PowerIcon size={16} />, permission: 'power' },
    { key: 'fullscreen', icon: <MaximizeIcon size={16} />, label: 'fullscreen.toggle' },
    { key: 'collapse', icon: <XIcon size={16} />, label: 'menu.collapse' }
  ];

  const items = allItems.filter((item) => !item.permission || hasPermission(item.permission));

  function updateItems(key: string) {
    const exist = menuDisabledItems.includes(key);

    const newItems = exist
      ? menuDisabledItems.filter((item) => item !== key)
      : [...menuDisabledItems, key];

    setMenuDisabledItems(newItems);
    ls.setMenuDisabledItems(newItems);
  }

  return (
    <div className="mt-8 flex flex-col space-y-5">
      <div className="flex flex-col">
        <span className="text-neutral-400">{t('settings.appearance.menuBar.icons')}</span>
        <span className="text-xs text-neutral-500">
          {t('settings.appearance.menuBar.iconsDesc')}
        </span>
      </div>

      <div className="mt-5 flex flex-col space-y-5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-neutral-400">
              {item.icon}
              <span className="text-neutral-300">
                {item.label ? t(item.label) : t(`${item.key}.title`)}
              </span>
            </div>

            <Switch
              value={!menuDisabledItems.includes(item.key)}
              onChange={() => updateItems(item.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
