import { useMemo } from 'react';
import { usePremiumStatus } from './usePremiumStatus';
import { useAuth } from '@/contexts/AuthContext';
import { PlanType } from '@/constants/accessLevels';

/**
 * Play Store linki - tek merkezi kaynak
 * Bu uygulama SADECE Android platformunda çalışır.
 */
export const STORE_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=app.golmetrik.android',
} as const;

interface UsePlatformPremiumReturn {
  /** Kullanıcının plan tipi */
  planType: PlanType;
  /** Premium kullanıcı mı (Basic+) */
  isPremium: boolean;
  /** Native platform mı (her zaman true - Android only app) */
  isNativePlatform: boolean;
  /** Yükleniyor mu */
  isLoading: boolean;
  /** Subscription data */
  subscription: ReturnType<typeof usePremiumStatus>['subscription'];
  /** Kalan gün sayısı */
  daysRemaining: number | null;
  /** Veriyi yenile */
  refetch: () => void;
}

/**
 * Android-only Premium Hook
 * 
 * Bu uygulama sadece Android platformunda çalışır.
 * Web ve iOS desteği bulunmamaktadır.
 */
export const usePlatformPremium = (): UsePlatformPremiumReturn => {
  const { user } = useAuth();
  const premiumStatus = usePremiumStatus();
  
  // Always native platform (Android only app)
  const isNativePlatform = true;

  // Plan type directly from premium status
  const planType = useMemo(() => {
    if (!user) return 'free' as PlanType;
    return premiumStatus.planType;
  }, [user, premiumStatus.planType]);

  // Premium status directly from premium status
  const isPremium = useMemo(() => {
    if (!user) return false;
    return premiumStatus.isPremium;
  }, [user, premiumStatus.isPremium]);

  return {
    planType,
    isPremium,
    isNativePlatform,
    isLoading: premiumStatus.isLoading,
    subscription: premiumStatus.subscription,
    daysRemaining: premiumStatus.daysRemaining,
    refetch: premiumStatus.refetch,
  };
};

// Re-export PlanType for convenience
export type { PlanType } from '@/constants/accessLevels';
