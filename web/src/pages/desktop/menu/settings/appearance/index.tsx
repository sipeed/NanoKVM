import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Language } from './language.tsx';
import { MenuBar } from './menu-bar.tsx';

export const Appearance = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-base font-bold">{t('settings.appearance.title')}</div>
      <Divider />

      <Language />
      <Divider />

      <MenuBar />
    </>
  );
};
