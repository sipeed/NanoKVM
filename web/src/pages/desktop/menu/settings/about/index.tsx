import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Community } from './community.tsx';
import { Hostname } from './hostname.tsx';
import { Information } from './information.tsx';
import { loadIsAdmin } from '../../../../../lib/localstorage.js';

export const About = () => {
  const { t } = useTranslation();
  const isAdmin = loadIsAdmin();

  return (
    <>
      <div className="text-base font-bold">{t('settings.about.title')}</div>
      <Divider />

      <Information />
      {isAdmin && <Hostname />}
      <Divider />

      <Community />
    </>
  );
};
