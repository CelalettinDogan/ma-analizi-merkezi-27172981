import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumStatus } from './usePremiumStatus';

interface UseAnalysisLimitReturn {
  canAnalyze: boolean;
  usageCount: number;
  dailyLimit: number;
  remaining: number;
  isLoading: boolean;
  incrementUsage: () => Promise<boolean>;
  checkLimit: () => Promise<boolean>;
  refetch: () => void;
}

// Limits based on plan type
const PLAN_LIMITS = {
  free: 2,
  basic: 10,
  pro: 999, // Practically unlimited
  ultra: 999,
};

export const useAnalysisLimit = (): UseAnalysisLimitReturn => {
  const { user } = useAuth();
  const { isPremium, subscription, isLoading: premiumLoading } = usePremiumStatus();
  const [usageCount, setUsageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Determine plan type from subscription
  const getPlanType = useCallback((): 'free' | 'basic' | 'pro' | 'ultra' => {
    if (!isPremium || !subscription) return 'free';
    
    const planType = subscription.plan_type?.toLowerCase() || '';
    if (planType.includes('ultra')) return 'ultra';
    if (planType.includes('pro')) return 'pro';
    if (planType.includes('basic') || planType.includes('temel')) return 'basic';
    
    // Default premium is pro level
    return 'pro';
  }, [isPremium, subscription]);

  const planType = getPlanType();
  const dailyLimit = PLAN_LIMITS[planType];
  const remaining = Math.max(0, dailyLimit - usageCount);
  const canAnalyze = remaining > 0;

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_daily_analysis_usage', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching analysis usage:', error);
        setUsageCount(0);
      } else {
        setUsageCount(data || 0);
      }
    } catch (e) {
      console.error('Error fetching analysis usage:', e);
      setUsageCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!premiumLoading) {
      fetchUsage();
    }
  }, [fetchUsage, premiumLoading]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Premium Pro/Ultra users don't need to track
    if (planType === 'pro' || planType === 'ultra') {
      return true;
    }

    try {
      const { data, error } = await supabase.rpc('increment_analysis_usage', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error incrementing analysis usage:', error);
        return false;
      }

      setUsageCount(data || usageCount + 1);
      return true;
    } catch (e) {
      console.error('Error incrementing analysis usage:', e);
      return false;
    }
  }, [user, planType, usageCount]);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    // Premium Pro/Ultra users always can analyze
    if (planType === 'pro' || planType === 'ultra') {
      return true;
    }

    await fetchUsage();
    return usageCount < dailyLimit;
  }, [planType, fetchUsage, usageCount, dailyLimit]);

  return {
    canAnalyze,
    usageCount,
    dailyLimit,
    remaining,
    isLoading: isLoading || premiumLoading,
    incrementUsage,
    checkLimit,
    refetch: fetchUsage,
  };
};
