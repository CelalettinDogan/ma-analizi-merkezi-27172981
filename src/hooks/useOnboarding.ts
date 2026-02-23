import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'golmetrik_onboarding_completed';
const NEW_USER_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

interface UseOnboardingReturn {
  hasSeenOnboarding: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user } = useAuth();
  
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    // Already completed in localStorage
    if (hasSeenOnboarding) return;

    // If user is logged in, check registration date
    if (user?.created_at) {
      const registeredAt = new Date(user.created_at).getTime();
      const now = Date.now();
      const isNewUser = (now - registeredAt) < NEW_USER_THRESHOLD_MS;

      if (!isNewUser) {
        // Existing user on new device/browser - skip onboarding and mark as completed
        localStorage.setItem(STORAGE_KEY, 'true');
        setHasSeenOnboarding(true);
        return;
      }
    }

    // New user or not logged in yet - show onboarding after delay
    const timer = setTimeout(() => {
      setShowOnboarding(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [hasSeenOnboarding, user]);

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
