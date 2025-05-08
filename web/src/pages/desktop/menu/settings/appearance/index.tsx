import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Language } from './language.tsx';
import { MenuBar } from './menu-bar.tsx';
import { WebTitle } from './web-title.tsx';

export const Appearance = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-base font-bold">{t('settings.appearance.title')}</div>
      <Divider />

      <div className="flex flex-col space-y-6">
        <Language />
        <WebTitle />
      </div>
      <Divider />

      <MenuBar />
    </>
  );
};
