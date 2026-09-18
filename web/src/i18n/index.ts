import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import et from './et.json';

export const supportedLanguages = ['et', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const STORAGE_KEY = 'lang';

// Initialize i18n once. Importing this file in main.tsx is enough.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      et: { translation: et },
    },
    fallbackLng: 'et',
    supportedLngs: supportedLanguages as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
    },
  });

export default i18n;
