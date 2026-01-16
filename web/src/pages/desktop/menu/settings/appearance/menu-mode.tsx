import { Segmented } from 'antd';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as storage from '@/lib/localstorage.ts';
import { menuDisplayModeAtom } from '@/jotai/settings.ts';

export const MenuMode = () => {
  const { t } = useTranslation();

  const [menuDisplayMode, setMenuDisplayMode] = useAtom(menuDisplayModeAtom);

  const options = [
    // { value: 'off', label: t('settings.appearance.menuBar.modeOff') },
    { value: 'auto', label: t('settings.appearance.menuBar.modeAuto') },
    { value: 'always', label: t('settings.appearance.menuBar.modeAlways') }
  ];

  function handleChange(mode: string) {
    if (mode === menuDisplayMode) return;

    setMenuDisplayMode(mode);
    storage.setMenuDisplayMode(mode);
  }

  return (
    <div className="mt-5 flex w-full items-center justify-between">
      <div className="flex flex-col">
        <span className="text-neutral-400">{t('settings.appearance.menuBar.mode')}</span>
        <span className="text-xs text-neutral-500">
          {t('settings.appearance.menuBar.modeDesc')}
        </span>
      </div>

      <Segmented value={menuDisplayMode} options={options} onChange={handleChange} />
    </div>
  );
};
