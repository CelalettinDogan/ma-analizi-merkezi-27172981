import { useMemo } from 'react';
import { usePlatformPremium } from './usePlatformPremium';
import { useUserRole } from './useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import {
  AccessLevel,
  PlanType,
  getAccessLevel,
  canAccessAIChat,
  hasUnlimitedAnalysis,
  isPremiumPlan,
  PLAN_DISPLAY_NAMES,
  PLAN_CHAT_LIMITS,
} from '@/constants/accessLevels';

interface UseAccessLevelReturn {
  /** Mevcut erişim seviyesi */
  accessLevel: AccessLevel;
  /** Plan tipi */
  planType: PlanType;
  /** Plan görüntüleme adı */
  planDisplayName: string;
  /** Admin mi */
  isAdmin: boolean;
  /** Premium plan mı (Basic+) */
  isPremium: boolean;
  /** AI Chat erişimi var mı */
  canUseAIChat: boolean;
  /** Sınırsız analiz hakkı var mı */
  hasUnlimitedAnalyses: boolean;
  /** Günlük analiz limiti */
  dailyAnalysisLimit: number;
  /** Günlük AI Chat limiti */
  dailyChatLimit: number;
  /** Gelişmiş istatistik erişimi */
  advancedStatsAccess: 'none' | 'partial' | 'full';
  /** Reklam gösterilmeli mi */
  shouldShowAds: boolean;
  /** Yükleniyor mu */
  isLoading: boolean;
  /** Guest (giriş yapmamış) mı */
  isGuest: boolean;
  /** Satın alma CTA gösterilmeli mi (Free/Guest) */
  shouldShowPurchaseCTA: boolean;
  /** Yükseltme CTA gösterilmeli mi (Premium ama Pro değil) */
  shouldShowUpgradeCTA: boolean;
  /** Analiz erişimi var mı */
  canAccessAnalysis: boolean;
}

/**
 * Merkezi erişim seviyesi hook'u
 * 
 * Tüm erişim kontrollerini tek bir yerden yönetir.
 * Plan ve rol bilgilerini birleştirerek tutarlı erişim sağlar.
 * 
 * Kullanıcı Tipleri:
 * - Guest: Giriş yapmamış
 * - Free: Giriş yapmış ama premium değil
 * - Premium Basic/Plus/Pro: Ödeme yapmış
 * - Admin: Sınırsız erişim
 * 
 * @example
 * ```tsx
 * const { canUseAIChat, isGuest, shouldShowPurchaseCTA } = useAccessLevel();
 * 
 * if (isGuest) return <GuestGate />;
 * if (!canUseAIChat) return <PremiumGate />;
 * ```
 */
export const useAccessLevel = (): UseAccessLevelReturn => {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    planType, 
    isPremium, 
    isLoading: premiumLoading 
  } = usePlatformPremium();
  
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Guest kontrolü
  const isGuest = !user;

  const accessLevel = useMemo(() => {
    return getAccessLevel(planType, isAdmin);
  }, [planType, isAdmin]);

  const canUseAIChat = useMemo(() => {
    if (isGuest) return false;
    return canAccessAIChat(planType, isAdmin);
  }, [isGuest, planType, isAdmin]);

  const hasUnlimitedAnalyses = useMemo(() => {
    if (isGuest) return false;
    return hasUnlimitedAnalysis(planType, isAdmin);
  }, [isGuest, planType, isAdmin]);

  // Satın alma CTA: Guest veya Free kullanıcılar için
  const shouldShowPurchaseCTA = useMemo(() => {
    if (isAdmin) return false;
    if (isGuest) return true; // Guest için store butonları göster
    return !isPremium; // Free kullanıcılar için
  }, [isGuest, isAdmin, isPremium]);

  // Yükseltme CTA: Premium ama Pro olmayan kullanıcılar için
  const shouldShowUpgradeCTA = useMemo(() => {
    if (isAdmin) return false;
    if (isGuest) return false;
    if (!isPremium) return false;
    return planType !== 'premium_pro';
  }, [isAdmin, isGuest, isPremium, planType]);

  // Analiz erişimi: Giriş yapmış herkes (limit dahilinde)
  const canAccessAnalysis = useMemo(() => {
    return !isGuest;
  }, [isGuest]);

  // Chat limiti
  const dailyChatLimit = useMemo(() => {
    if (isAdmin) return 999;
    return PLAN_CHAT_LIMITS[planType];
  }, [isAdmin, planType]);

  return {
    accessLevel,
    planType,
    planDisplayName: PLAN_DISPLAY_NAMES[planType],
    isAdmin,
    isPremium: isPremiumPlan(planType),
    canUseAIChat,
    hasUnlimitedAnalyses,
    dailyAnalysisLimit: accessLevel.dailyAnalysis,
    dailyChatLimit,
    advancedStatsAccess: accessLevel.advancedStats,
    shouldShowAds: accessLevel.showAds,
    isLoading: authLoading || premiumLoading || roleLoading,
    isGuest,
    shouldShowPurchaseCTA,
    shouldShowUpgradeCTA,
    canAccessAnalysis,
  };
};
