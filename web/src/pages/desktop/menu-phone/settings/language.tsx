import { Popover } from 'antd';
import clsx from 'clsx';
import { LanguagesIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { languages } from '@/i18n/languages.ts';
import { setLanguage } from '@/lib/localstorage.ts';

export const Language = () => {
  const { t, i18n } = useTranslation();

  function changeLanguage(lng: string) {
    if (i18n.language === lng) return;

    i18n.changeLanguage(lng);
    setLanguage(lng);
  }

  const content = (
    <>
      {languages.map((lng) => (
        <div
          key={lng.key}
          className={clsx(
            'flex cursor-pointer select-none items-center space-x-1 rounded px-5 py-1',
            i18n.language === lng.key ? 'text-blue-500' : 'text-white hover:bg-neutral-700'
          )}
          onClick={() => changeLanguage(lng.key)}
        >
          {lng.name}
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="right" trigger="hover" arrow>
      <div className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 text-white hover:bg-neutral-600">
        <LanguagesIcon size={16} />
        <span>{t('language')}</span>
      </div>
    </Popover>
  );
};
