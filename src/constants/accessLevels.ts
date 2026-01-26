/**
 * Merkezi Erişim Seviyeleri Tanımları
 * 
 * Rol ve paket bazlı tüm erişim kuralları burada tanımlanır.
 * Bu uygulama SADECE Android platformunda çalışır.
 */

export type PlanType = 'free' | 'premium_basic' | 'premium_plus' | 'premium_pro';

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
 * Plan bazlı erişim seviyeleri
 * 
 * - Free: 2 analiz/gün, AI Chat yok
 * - Premium Basic: Sınırsız analiz, 3 chat/gün
 * - Premium Plus: Sınırsız analiz, 5 chat/gün
 * - Premium Pro: Sınırsız analiz, 10 chat/gün
 */
export const PLAN_ACCESS_LEVELS: Record<PlanType, AccessLevel> = {
  free: {
    dailyAnalysis: 2,
    aiChat: 0,  // Erişim yok
    historyDays: 7,
    advancedStats: 'partial',
    showAds: true,
    prioritySupport: false,
  },
  premium_basic: {
    dailyAnalysis: 999, // Sınırsız
    aiChat: 3,
    historyDays: 30,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: false,
  },
  premium_plus: {
    dailyAnalysis: 999,
    aiChat: 5,
    historyDays: 999,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: true,
  },
  premium_pro: {
    dailyAnalysis: 999,
    aiChat: 10,
    historyDays: 999,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: true,
  },
} as const;

/**
 * Admin kullanıcılar için özel erişim seviyesi
 * Tüm limitler devre dışı
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
 * Erişim seviyesini plan tipine göre döndürür
 */
export const getAccessLevel = (
  planType: PlanType,
  isAdmin: boolean = false
): AccessLevel => {
  if (isAdmin) {
    return ADMIN_ACCESS_LEVEL;
  }
  
  return PLAN_ACCESS_LEVELS[planType];
};

/**
 * AI Chat erişimi kontrolü
 * Premium planlar + Admin erişebilir
 */
export const canAccessAIChat = (
  planType: PlanType,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  return planType !== 'free';
};

/**
 * Premium plan kontrolü (tüm premium planlar)
 */
export const isPremiumPlan = (planType: PlanType): boolean => {
  return planType !== 'free';
};

/**
 * Sınırsız analiz kontrolü (tüm premium planlar)
 */
export const hasUnlimitedAnalysis = (
  planType: PlanType,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  return planType !== 'free';
};

/**
 * Satın alma CTA gösterilmeli mi?
 * Sadece Free kullanıcılar için
 */
export const shouldShowPurchaseCTA = (
  planType: PlanType,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return false;
  return planType === 'free';
};

/**
 * Yükseltme CTA gösterilmeli mi?
 * Premium ama Pro olmayan kullanıcılar için
 */
export const shouldShowUpgradeCTA = (
  planType: PlanType,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return false;
  if (planType === 'free') return false;
  return planType !== 'premium_pro';
};

/**
 * Plan görüntüleme isimleri (Türkçe)
 */
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  free: 'Ücretsiz',
  premium_basic: 'Premium Basic',
  premium_plus: 'Premium Plus',
  premium_pro: 'Premium Pro',
} as const;

/**
 * Plan fiyatları (TRY)
 */
export const PLAN_PRICES = {
  premium_basic: {
    monthly: 49,
    yearly: 399, // 2 ay bedava
  },
  premium_plus: {
    monthly: 79,
    yearly: 649, // 2 ay bedava
  },
  premium_pro: {
    monthly: 99,
    yearly: 799, // 2 ay bedava
  },
} as const;

/**
 * Chat limit kontrolü - Plan bazlı
 */
export const PLAN_CHAT_LIMITS: Record<PlanType, number> = {
  free: 0,
  premium_basic: 3,
  premium_plus: 5,
  premium_pro: 10,
} as const;
