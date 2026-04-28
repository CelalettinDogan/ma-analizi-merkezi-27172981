// Supported languages and their metadata
export const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' as const },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' as const },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' as const },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' as const },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' as const },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'tr';
export const FALLBACK_LANGUAGE: LanguageCode = 'en';
export const LANGUAGE_STORAGE_KEY = 'app-language';

export const isSupportedLanguage = (code: string): code is LanguageCode =>
  SUPPORTED_LANGUAGES.some((l) => l.code === code);

export const getLanguageMeta = (code: string) =>
  SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
