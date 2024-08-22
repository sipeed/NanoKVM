import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getLanguage } from '@/lib/localstorage.ts';

import { en } from './en';
import { fr } from './fr';
import { zh } from './zh';

const resources = { en, fr, zh };

function getCurrentLanguage(): string {
  const languages = Object.keys(resources);

  const cookieLng = getLanguage();
  if (cookieLng && languages.includes(cookieLng)) {
    return cookieLng;
  }

  const navigatorLng = navigator.language.split('-')[0];
  if (languages.includes(navigatorLng)) {
    return navigatorLng;
  }

  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: resources,
    lng: getCurrentLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })
  .then();

export default i18n;
