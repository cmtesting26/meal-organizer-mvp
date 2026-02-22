/**
 * i18n Configuration (Sprint 7)
 *
 * Sets up react-i18next with EN/DE translations.
 * Language preference persisted in localStorage.
 * Detects browser language as initial default.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import de from './de.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'meal-organizer-language', // Keep legacy key for backward compat with existing installs
      caches: ['localStorage'],
    },
  });

export default i18n;

/**
 * Locale-aware date format strings
 * DE: DD.MM.YYYY
 * EN: MM/DD/YYYY
 */
export function getDateFormat(lng?: string): string {
  const lang = lng || i18n.language;
  return lang === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
}

export function getShortDateFormat(lng?: string): string {
  const lang = lng || i18n.language;
  return lang === 'de' ? 'EEE d.M.' : 'EEE M/d';
}
