import { useMemo } from 'react';
import { usePlatform } from './usePlatform';
import { usePremiumStatus, PlanType } from './usePremiumStatus';

export type AppPlatform = 'web' | 'android' | 'ios';

interface UsePlatformPremiumReturn {
  // Platform info
  appPlatform: AppPlatform;
  isWebPlatform: boolean;
  isNativePlatform: boolean;
  
  // Premium status (platform-aware)
  isPremium: boolean;
  canBePremium: boolean; // Web users can NEVER be premium
  planType: PlanType;
  
  // Feature access
  canAccessPremiumFeatures: boolean;
  canPurchasePremium: boolean;
  
  // Analysis limits (platform-specific)
  webAnalysisLimit: number;
  
  // Loading state
  isLoading: boolean;
  
  // Subscription data (only for native)
  subscription: ReturnType<typeof usePremiumStatus>['subscription'];
  daysRemaining: number | null;
  refetch: () => void;
}

// Web users get a fixed daily limit, never premium
const WEB_DAILY_ANALYSIS_LIMIT = 3;

/**
 * Platform-aware premium hook
 * 
 * Key Rules:
 * - Web platform: NEVER premium, purchases blocked, limited analysis
 * - Android platform: Premium available via Google Play
 * - iOS platform: Premium available via App Store (future)
 */
export const usePlatformPremium = (): UsePlatformPremiumReturn => {
  const { platform, isNative, isWeb } = usePlatform();
  const premiumStatus = usePremiumStatus();

  const appPlatform: AppPlatform = useMemo(() => {
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
    return 'web';
  }, [platform]);

  // Web users can NEVER be premium - this is the core rule
  const canBePremium = !isWeb;
  
  // Actual premium status - only valid on native platforms
  const isPremium = useMemo(() => {
    if (isWeb) return false; // Web users are NEVER premium
    return premiumStatus.isPremium;
  }, [isWeb, premiumStatus.isPremium]);

  // Plan type - web users are always 'free'
  const planType: PlanType = useMemo(() => {
    if (isWeb) return 'free';
    return premiumStatus.planType;
  }, [isWeb, premiumStatus.planType]);

  // Feature access - premium features only on native with active subscription
  const canAccessPremiumFeatures = isPremium && !isWeb;

  // Purchase capability - only on native platforms
  const canPurchasePremium = isNative;

  return {
    // Platform info
    appPlatform,
    isWebPlatform: isWeb,
    isNativePlatform: isNative,
    
    // Premium status
    isPremium,
    canBePremium,
    planType,
    
    // Feature access
    canAccessPremiumFeatures,
    canPurchasePremium,
    
    // Analysis limits
    webAnalysisLimit: WEB_DAILY_ANALYSIS_LIMIT,
    
    // Loading
    isLoading: premiumStatus.isLoading,
    
    // Pass through subscription data
    subscription: premiumStatus.subscription,
    daysRemaining: premiumStatus.daysRemaining,
    refetch: premiumStatus.refetch,
  };
};

// Store links - iOS not yet available, both redirect to Play Store
export const STORE_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=app.golmetrik.android',
  // iOS app not yet available - use Play Store as fallback
  appStore: 'https://play.google.com/store/apps/details?id=app.golmetrik.android',
} as const;

// Helper to get appropriate store link based on user device
export const getStoreLink = (userAgent?: string): string => {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  
  // Check if user is on iOS device (even if viewing web)
  if (/iPad|iPhone|iPod/.test(ua)) {
    return STORE_LINKS.appStore;
  }
  
  // Default to Play Store for Android and all others
  return STORE_LINKS.playStore;
};
