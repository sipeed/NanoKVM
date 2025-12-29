import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { Community } from './community.tsx';
import { Information } from './information.tsx';

export const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-base">{t('settings.about.title')}</div>
      <Divider className="opacity-50" />

      <Information />
      <Divider className="opacity-50" />

      <Community />
    </>
  );
};
