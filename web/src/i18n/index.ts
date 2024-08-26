import i18n from 'i18next';
import type { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getLanguage } from '@/lib/localstorage.ts';

function getResources(): Resource {
  const resources: Resource = {};

  const modules: Record<string, Resource> = import.meta.glob('./locales/*.ts', { eager: true });

  for (const path in modules) {
    const moduleName = path.split('/').pop()?.replace('.ts', '');
    if (moduleName) {
      resources[moduleName] = modules[path].default;
    }
  }

  return resources;
}

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

const resources = getResources();
const lng = getCurrentLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })
  .then();

export default i18n;
