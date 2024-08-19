import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getLanguage } from '@/lib/localstorage.ts';

import { en } from './en';
import { zh } from './zh';
import { fr } from './fr';

const lng = getLanguage();

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: { zh, en, fr },
    lng,

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })
  .then();

export default i18n;
