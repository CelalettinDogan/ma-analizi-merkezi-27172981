import { tr, enUS, de, es, ar } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import i18n from './config';

const DATE_LOCALES: Record<string, Locale> = {
  tr,
  en: enUS,
  de,
  es,
  ar,
};

/** Returns the date-fns locale matching the active i18n language. */
export const getDateLocale = (language?: string): Locale => {
  const lang = (language || i18n.language || 'tr').split('-')[0];
  return DATE_LOCALES[lang] || tr;
};
