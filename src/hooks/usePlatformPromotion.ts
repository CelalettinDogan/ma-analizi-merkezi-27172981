import { useState, useCallback, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

type PromotionStrategy = 'mobile_premium' | 'desktop_app_download';

interface UsePlatformPromotionReturn {
  isMobile: boolean;
  isDesktop: boolean;
  promotionStrategy: PromotionStrategy;
  showAppDownload: boolean;
  setShowAppDownload: (show: boolean) => void;
  dismissAppDownload: () => void;
  shouldShowAppDownload: () => boolean;
}

const APP_DOWNLOAD_STORAGE_KEY = 'app_download_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const usePlatformPromotion = (): UsePlatformPromotionReturn => {
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const [showAppDownload, setShowAppDownload] = useState(false);

  const promotionStrategy: PromotionStrategy = isMobile 
    ? 'mobile_premium' 
    : 'desktop_app_download';

  const shouldShowAppDownload = useCallback((): boolean => {
    if (isMobile) return false;
    
    try {
      const dismissed = localStorage.getItem(APP_DOWNLOAD_STORAGE_KEY);
      if (!dismissed) return true;
      
      const dismissedAt = parseInt(dismissed, 10);
      return Date.now() - dismissedAt > DISMISS_DURATION;
    } catch {
      return true;
    }
  }, [isMobile]);

  const dismissAppDownload = useCallback(() => {
    try {
      localStorage.setItem(APP_DOWNLOAD_STORAGE_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
    setShowAppDownload(false);
  }, []);

  // Auto-show app download banner on desktop after delay
  useEffect(() => {
    if (isDesktop && shouldShowAppDownload()) {
      const timer = setTimeout(() => {
        setShowAppDownload(true);
      }, 10000); // Show after 10 seconds on desktop
      
      return () => clearTimeout(timer);
    }
  }, [isDesktop, shouldShowAppDownload]);

  return {
    isMobile,
    isDesktop,
    promotionStrategy,
    showAppDownload,
    setShowAppDownload,
    dismissAppDownload,
    shouldShowAppDownload,
  };
};
