import { Select } from 'antd';
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
    <div className="mt-5 flex items-center justify-between space-x-5">
      <div className="flex flex-col space-y-1">
        <span>{t('settings.appearance.language')}</span>
        <span className="text-xs text-neutral-500">{t('settings.appearance.languageDesc')}</span>
      </div>

      <div>
        <Select
          defaultValue={i18n.language}
          style={{ width: 180 }}
          options={options}
          onSelect={changeLanguage}
        />
      </div>
    </div>
  );
};
