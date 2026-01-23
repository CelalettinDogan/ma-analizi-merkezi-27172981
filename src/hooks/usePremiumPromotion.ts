import { useState, useCallback, useEffect } from 'react';

type PromotionType = 'limit' | 'feature' | 'general' | 'chatbot';

interface UsePremiumPromotionReturn {
  showPromotion: (type: PromotionType) => void;
  dismissPromotion: () => void;
  shouldShowPromotion: (type: PromotionType) => boolean;
  promotionVisible: boolean;
  promotionType: PromotionType | null;
}

const STORAGE_KEY = 'premium_promotion_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export const usePremiumPromotion = (): UsePremiumPromotionReturn => {
  const [promotionVisible, setPromotionVisible] = useState(false);
  const [promotionType, setPromotionType] = useState<PromotionType | null>(null);

  const getDismissedPromotions = useCallback((): Record<string, number> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const shouldShowPromotion = useCallback((type: PromotionType): boolean => {
    const dismissed = getDismissedPromotions();
    const dismissedAt = dismissed[type];
    
    if (!dismissedAt) return true;
    
    // Check if 24 hours have passed
    return Date.now() - dismissedAt > DISMISS_DURATION;
  }, [getDismissedPromotions]);

  const showPromotion = useCallback((type: PromotionType) => {
    if (shouldShowPromotion(type)) {
      setPromotionType(type);
      setPromotionVisible(true);
    }
  }, [shouldShowPromotion]);

  const dismissPromotion = useCallback(() => {
    if (promotionType) {
      const dismissed = getDismissedPromotions();
      dismissed[promotionType] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    }
    setPromotionVisible(false);
    setPromotionType(null);
  }, [promotionType, getDismissedPromotions]);

  // Cleanup old entries on mount
  useEffect(() => {
    const dismissed = getDismissedPromotions();
    const now = Date.now();
    let hasChanges = false;

    Object.keys(dismissed).forEach(key => {
      if (now - dismissed[key] > DISMISS_DURATION) {
        delete dismissed[key];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    }
  }, [getDismissedPromotions]);

  return {
    showPromotion,
    dismissPromotion,
    shouldShowPromotion,
    promotionVisible,
    promotionType,
  };
};
