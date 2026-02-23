import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'golmetrik_onboarding_completed';

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
  const [dbChecked, setDbChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Check DB for onboarding status when user is logged in
  useEffect(() => {
    if (!user) {
      setDbChecked(true);
      return;
    }

    const checkDb = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (data?.onboarding_completed) {
          setHasSeenOnboarding(true);
          localStorage.setItem(STORAGE_KEY, 'true');
        }
      } catch {
        // fallback to localStorage
      } finally {
        setDbChecked(true);
      }
    };

    checkDb();
  }, [user]);

  // Show onboarding only after DB check completes
  useEffect(() => {
    if (!dbChecked) return;
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding, dbChecked]);

  const completeOnboarding = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenOnboarding(true);
    setShowOnboarding(false);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true } as any)
          .eq('user_id', user.id);
      } catch {
        // localStorage already set as fallback
      }
    }
  }, [user]);

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
