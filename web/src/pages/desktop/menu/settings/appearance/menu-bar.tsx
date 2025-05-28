import { Switch } from 'antd';
import { useAtom } from 'jotai';
import {
  DiscIcon,
  DownloadIcon,
  FileJsonIcon,
  NetworkIcon,
  PowerIcon,
  TerminalSquareIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as ls from '@/lib/localstorage.ts';
import { menuDisabledItemsAtom } from '@/jotai/settings.ts';
import { loadIsAdmin } from '../../../../../lib/localstorage';

export const MenuBar = () => {
  const { t } = useTranslation();

  const [menuDisabledItems, setMenuDisabledItems] = useAtom(menuDisabledItemsAtom);
  const isAdmin = loadIsAdmin();
  const items = isAdmin ? [
    { key: 'image', icon: <DiscIcon size={16} /> },
    { key: 'download', icon: <DownloadIcon size={16} /> },
    { key: 'script', icon: <FileJsonIcon size={15} /> },
    { key: 'terminal', icon: <TerminalSquareIcon size={16} /> },
    { key: 'wol', icon: <NetworkIcon size={16} /> },
    { key: 'power', icon: <PowerIcon size={16} /> }
    ] :
    [
      { key: 'image', icon: <DiscIcon size={16} /> },
      { key: 'download', icon: <DownloadIcon size={16} /> },
      { key: 'script', icon: <FileJsonIcon size={15} /> },
      { key: 'wol', icon: <NetworkIcon size={16} /> },
      { key: 'power', icon: <PowerIcon size={16} /> }
  ];

  function updateItems(key: string) {
    const exist = menuDisabledItems.includes(key);

    const newItems = exist
      ? menuDisabledItems.filter((item) => item !== key)
      : [...menuDisabledItems, key];

    setMenuDisabledItems(newItems);
    ls.setMenuDisabledItems(newItems);
  }

  return (
    <>
      <div className="flex flex-col">
        <span className="text-neutral-400">{t('settings.appearance.menuBar')}</span>
        <span className="text-xs text-neutral-500">{t('settings.appearance.menuBarDesc')}</span>
      </div>

      <div className="flex flex-col space-y-4 pt-5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {item.icon}
              <span>{t(`${item.key}.title`)}</span>
            </div>
            <Switch
              value={!menuDisabledItems.includes(item.key)}
              onChange={() => updateItems(item.key)}
            />
          </div>
        ))}
      </div>
    </>
  );
};
