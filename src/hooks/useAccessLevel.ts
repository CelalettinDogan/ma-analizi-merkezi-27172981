import { useMemo } from 'react';
import { usePlatformPremium } from './usePlatformPremium';
import { useUserRole } from './useUserRole';
import {
  AccessLevel,
  PlanType,
  getAccessLevel,
  canAccessAIChat,
  hasUnlimitedAnalysis,
  isPremiumPlan,
  PLAN_DISPLAY_NAMES,
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
}

/**
 * Merkezi erişim seviyesi hook'u
 * 
 * Tüm erişim kontrollerini tek bir yerden yönetir.
 * Plan ve rol bilgilerini birleştirerek tutarlı erişim sağlar.
 * 
 * @example
 * ```tsx
 * const { canUseAIChat, dailyAnalysisLimit, isPremium } = useAccessLevel();
 * 
 * if (!canUseAIChat) {
 *   return <PremiumGate variant="chatbot" />;
 * }
 * ```
 */
export const useAccessLevel = (): UseAccessLevelReturn => {
  const { 
    planType, 
    isPremium, 
    isLoading: premiumLoading 
  } = usePlatformPremium();
  
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const accessLevel = useMemo(() => {
    return getAccessLevel(planType, isAdmin);
  }, [planType, isAdmin]);

  const canUseAIChat = useMemo(() => {
    return canAccessAIChat(planType, isAdmin);
  }, [planType, isAdmin]);

  const hasUnlimitedAnalyses = useMemo(() => {
    return hasUnlimitedAnalysis(planType, isAdmin);
  }, [planType, isAdmin]);

  return {
    accessLevel,
    planType,
    planDisplayName: PLAN_DISPLAY_NAMES[planType],
    isAdmin,
    isPremium: isPremiumPlan(planType),
    canUseAIChat,
    hasUnlimitedAnalyses,
    dailyAnalysisLimit: accessLevel.dailyAnalysis,
    dailyChatLimit: accessLevel.aiChat,
    advancedStatsAccess: accessLevel.advancedStats,
    shouldShowAds: accessLevel.showAds,
    isLoading: premiumLoading || roleLoading,
  };
};
