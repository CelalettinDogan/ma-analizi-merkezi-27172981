/**
 * Merkezi Erişim Seviyeleri Tanımları
 * 
 * Platform ve plan bazlı tüm erişim kuralları burada tanımlanır.
 * Bu dosya sayesinde erişim kontrolü tutarlı ve merkezi olur.
 */

export type PlanType = 'free' | 'basic' | 'pro' | 'ultra';
export type PlatformType = 'web' | 'android' | 'ios';

export interface AccessLevel {
  /** Günlük analiz limiti (999 = sınırsız) */
  dailyAnalysis: number;
  /** Günlük AI Chat limiti (0 = erişim yok, 999 = sınırsız) */
  aiChat: number;
  /** Analiz geçmişi görüntüleme limiti (gün) */
  historyDays: number;
  /** Gelişmiş istatistiklere erişim seviyesi */
  advancedStats: 'none' | 'partial' | 'full';
  /** Reklam gösterimi */
  showAds: boolean;
  /** Öncelikli destek */
  prioritySupport: boolean;
}

/**
 * Plan bazlı erişim seviyeleri (Android/iOS için)
 */
export const PLAN_ACCESS_LEVELS: Record<PlanType, AccessLevel> = {
  free: {
    dailyAnalysis: 2,
    aiChat: 0,
    historyDays: 7,
    advancedStats: 'partial',
    showAds: true,
    prioritySupport: false,
  },
  basic: {
    dailyAnalysis: 10,
    aiChat: 0,
    historyDays: 30,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: false,
  },
  pro: {
    dailyAnalysis: 999,
    aiChat: 3,
    historyDays: 999,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: true,
  },
  ultra: {
    dailyAnalysis: 999,
    aiChat: 999,
    historyDays: 999,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: true,
  },
} as const;

/**
 * Web platformu için özel erişim seviyesi
 * Web'de Premium satışı yapılmaz, sadece uygulama indirme önerilir
 */
export const WEB_ACCESS_LEVEL: AccessLevel = {
  dailyAnalysis: 3,
  aiChat: 0,
  historyDays: 7,
  advancedStats: 'partial',
  showAds: true,
  prioritySupport: false,
} as const;

/**
 * Admin kullanıcılar için özel erişim seviyesi
 */
export const ADMIN_ACCESS_LEVEL: AccessLevel = {
  dailyAnalysis: 999,
  aiChat: 999,
  historyDays: 999,
  advancedStats: 'full',
  showAds: false,
  prioritySupport: true,
} as const;

/**
 * Erişim seviyesini plan ve platforma göre döndürür
 */
export const getAccessLevel = (
  planType: PlanType,
  isWebPlatform: boolean,
  isAdmin: boolean = false
): AccessLevel => {
  if (isAdmin) {
    return ADMIN_ACCESS_LEVEL;
  }
  
  if (isWebPlatform) {
    return WEB_ACCESS_LEVEL;
  }
  
  return PLAN_ACCESS_LEVELS[planType];
};

/**
 * AI Chat erişimi kontrolü
 * Pro ve Ultra planlar + Admin erişebilir
 */
export const canAccessAIChat = (
  planType: PlanType,
  isWebPlatform: boolean,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  if (isWebPlatform) return false;
  return planType === 'pro' || planType === 'ultra';
};

/**
 * Premium plan kontrolü (Basic ve üzeri)
 */
export const isPremiumPlan = (planType: PlanType): boolean => {
  return planType !== 'free';
};

/**
 * Sınırsız analiz kontrolü (Pro ve Ultra)
 */
export const hasUnlimitedAnalysis = (
  planType: PlanType,
  isWebPlatform: boolean,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  if (isWebPlatform) return false;
  return planType === 'pro' || planType === 'ultra';
};

/**
 * Plan görüntüleme isimleri (Türkçe)
 */
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  free: 'Ücretsiz',
  basic: 'Temel',
  pro: 'Pro',
  ultra: 'Ultra',
} as const;

/**
 * Plan fiyatları (TRY)
 */
export const PLAN_PRICES = {
  basic: {
    monthly: 99,
    yearly: 799, // 2 ay bedava
  },
  pro: {
    monthly: 199,
    yearly: 1599, // 2 ay bedava
  },
  ultra: {
    monthly: 349,
    yearly: 2799, // 2 ay bedava
  },
} as const;
