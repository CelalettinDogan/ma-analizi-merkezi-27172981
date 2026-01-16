import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'futboltahmin_onboarding_completed';

interface UseOnboardingReturn {
  hasSeenOnboarding: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    // Show onboarding only for new users (never seen before)
    if (!hasSeenOnboarding) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSeenOnboarding(false);
    setShowOnboarding(true);
  }, []);

  return {
    hasSeenOnboarding,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
};
