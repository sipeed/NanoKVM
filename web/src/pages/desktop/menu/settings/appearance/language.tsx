import { Select } from 'antd';
import { LanguagesIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import languages from '@/i18n/languages.ts';
import { setLanguage } from '@/lib/localstorage.ts';

export const Language = () => {
  const { t, i18n } = useTranslation();

  const options = languages.map((language) => ({
    value: language.key,
    label: language.name
  }));

  function changeLanguage(value: string) {
    if (i18n.language === value) return;

    i18n.changeLanguage(value);
    setLanguage(value);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
        <LanguagesIcon size={16} />
        <span>{t('settings.appearance.language')}</span>
      </div>

      <Select
        defaultValue={i18n.language}
        style={{ width: 180 }}
        options={options}
        onSelect={changeLanguage}
      />
    </div>
  );
};
