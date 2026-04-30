import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

import {
  SUPPORTED_LANGUAGES,
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
  getLanguageMeta,
  type LanguageCode,
} from './languages';

// TR
import trCommon from './locales/tr/common.json';
import trAuth from './locales/tr/auth.json';
import trHome from './locales/tr/home.json';
import trAnalysis from './locales/tr/analysis.json';
import trPremium from './locales/tr/premium.json';
import trProfile from './locales/tr/profile.json';
import trPredictions from './locales/tr/predictions.json';
import trChat from './locales/tr/chat.json';
import trLegal from './locales/tr/legal.json';
import trStreak from './locales/tr/streak.json';
import trPredictor from './locales/tr/predictor.json';
import trRewards from './locales/tr/rewards.json';

// EN
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enAnalysis from './locales/en/analysis.json';
import enPremium from './locales/en/premium.json';
import enProfile from './locales/en/profile.json';
import enPredictions from './locales/en/predictions.json';
import enChat from './locales/en/chat.json';
import enLegal from './locales/en/legal.json';
import enStreak from './locales/en/streak.json';
import enPredictor from './locales/en/predictor.json';

// DE
import deCommon from './locales/de/common.json';
import deAuth from './locales/de/auth.json';
import deHome from './locales/de/home.json';
import deAnalysis from './locales/de/analysis.json';
import dePremium from './locales/de/premium.json';
import deProfile from './locales/de/profile.json';
import dePredictions from './locales/de/predictions.json';
import deChat from './locales/de/chat.json';
import deLegal from './locales/de/legal.json';
import deStreak from './locales/de/streak.json';
import dePredictor from './locales/de/predictor.json';

// ES
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esHome from './locales/es/home.json';
import esAnalysis from './locales/es/analysis.json';
import esPremium from './locales/es/premium.json';
import esProfile from './locales/es/profile.json';
import esPredictions from './locales/es/predictions.json';
import esChat from './locales/es/chat.json';
import esLegal from './locales/es/legal.json';
import esStreak from './locales/es/streak.json';
import esPredictor from './locales/es/predictor.json';

// AR
import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arHome from './locales/ar/home.json';
import arAnalysis from './locales/ar/analysis.json';
import arPremium from './locales/ar/premium.json';
import arProfile from './locales/ar/profile.json';
import arPredictions from './locales/ar/predictions.json';
import arChat from './locales/ar/chat.json';
import arLegal from './locales/ar/legal.json';
import arStreak from './locales/ar/streak.json';
import arPredictor from './locales/ar/predictor.json';

const resources = {
  tr: { common: trCommon, auth: trAuth, home: trHome, analysis: trAnalysis, premium: trPremium, profile: trProfile, predictions: trPredictions, chat: trChat, legal: trLegal, streak: trStreak, predictor: trPredictor },
  en: { common: enCommon, auth: enAuth, home: enHome, analysis: enAnalysis, premium: enPremium, profile: enProfile, predictions: enPredictions, chat: enChat, legal: enLegal, streak: enStreak, predictor: enPredictor },
  de: { common: deCommon, auth: deAuth, home: deHome, analysis: deAnalysis, premium: dePremium, profile: deProfile, predictions: dePredictions, chat: deChat, legal: deLegal, streak: deStreak, predictor: dePredictor },
  es: { common: esCommon, auth: esAuth, home: esHome, analysis: esAnalysis, premium: esPremium, profile: esProfile, predictions: esPredictions, chat: esChat, legal: esLegal, streak: esStreak, predictor: esPredictor },
  ar: { common: arCommon, auth: arAuth, home: arHome, analysis: arAnalysis, premium: arPremium, profile: arProfile, predictions: arPredictions, chat: arChat, legal: arLegal, streak: arStreak, predictor: arPredictor },
};

/**
 * Detect the initial language by checking, in order:
 * 1. User-saved preference (Capacitor Preferences on native, localStorage on web)
 * 2. Device language (Capacitor Device on native, navigator.language on web)
 * 3. FALLBACK_LANGUAGE (en)
 */
async function detectInitialLanguage(): Promise<LanguageCode> {
  try {
    // 1. Saved preference
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: LANGUAGE_STORAGE_KEY });
      if (value && isSupportedLanguage(value)) return value;
    } else if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && isSupportedLanguage(stored)) return stored;
    }

    // 2. Device language
    let deviceLang = '';
    if (Capacitor.isNativePlatform()) {
      const { value } = await Device.getLanguageCode();
      deviceLang = value || '';
    } else if (typeof navigator !== 'undefined') {
      deviceLang = navigator.language || '';
    }
    const short = deviceLang.split('-')[0].toLowerCase();
    if (isSupportedLanguage(short)) return short;
  } catch (err) {
    console.warn('[i18n] Language detection failed:', err);
  }
  return FALLBACK_LANGUAGE;
}

/**
 * Apply <html lang> and dir attributes based on active language.
 */
function applyHtmlAttributes(lang: string) {
  if (typeof document === 'undefined') return;
  const meta = getLanguageMeta(lang);
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
}

/**
 * Persist user language choice across sessions.
 */
export async function persistLanguage(lang: LanguageCode): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: LANGUAGE_STORAGE_KEY, value: lang });
    } else if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  } catch (err) {
    console.warn('[i18n] Failed to persist language:', err);
  }
}

/**
 * Change the active language and persist the choice.
 */
export async function changeLanguage(lang: LanguageCode): Promise<void> {
  await i18n.changeLanguage(lang);
  applyHtmlAttributes(lang);
  await persistLanguage(lang);
}

// Initialize synchronously with fallback, then update once detection completes.
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: FALLBACK_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    defaultNS: 'common',
    ns: ['common', 'auth', 'home', 'analysis', 'premium', 'profile', 'predictions', 'chat', 'legal', 'streak', 'predictor'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

// Async detect & switch (non-blocking)
detectInitialLanguage().then((lang) => {
  if (i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }
  applyHtmlAttributes(lang);
});

export default i18n;
