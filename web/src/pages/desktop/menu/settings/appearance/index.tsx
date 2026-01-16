import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Language } from './language.tsx';
import { MenuIcons } from './menu-icons.tsx';
import { MenuMode } from './menu-mode.tsx';
import { WebTitle } from './web-title.tsx';

export const Appearance = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-base">{t('settings.appearance.title')}</div>
      <Divider className="opacity-50" />

      <div className="text-neutral-400">{t('settings.appearance.display')}</div>
      <Language />
      <WebTitle />

      <Divider className="opacity-50" style={{ margin: '32px 0' }} />

      <div className="text-neutral-400">{t('settings.appearance.menuBar.title')}</div>
      <MenuMode />
      <MenuIcons />
    </>
  );
};
