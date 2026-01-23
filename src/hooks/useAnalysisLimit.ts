import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformPremium } from './usePlatformPremium';

interface UseAnalysisLimitReturn {
  canAnalyze: boolean;
  usageCount: number;
  dailyLimit: number;
  remaining: number;
  isLoading: boolean;
  incrementUsage: () => Promise<boolean>;
  checkLimit: () => Promise<boolean>;
  refetch: () => void;
  // Platform-specific info
  isWebPlatform: boolean;
  showAppDownloadPrompt: boolean;
}

// Limits based on plan type - WEB users always get web limit
const PLAN_LIMITS = {
  free: 2,
  basic: 10,
  pro: 999, // Practically unlimited
  ultra: 999,
};

// Web platform specific limit (always applies on web, regardless of any premium status)
const WEB_PLATFORM_LIMIT = 3;

export const useAnalysisLimit = (): UseAnalysisLimitReturn => {
  const { user } = useAuth();
  const { 
    planType, 
    isPremium, 
    isWebPlatform, 
    isLoading: premiumLoading 
  } = usePlatformPremium();
  
  const [usageCount, setUsageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // On web: always use web limit (3), never premium
  // On native: use plan-based limits
  const dailyLimit = isWebPlatform ? WEB_PLATFORM_LIMIT : PLAN_LIMITS[planType];
  const remaining = Math.max(0, dailyLimit - usageCount);
  const canAnalyze = remaining > 0;
  
  // Show app download prompt when web user hits limit
  const showAppDownloadPrompt = isWebPlatform && !canAnalyze;

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

    // On web: always track usage (no unlimited)
    // On native: Premium Pro/Ultra users don't need to track
    if (!isWebPlatform && (planType === 'pro' || planType === 'ultra')) {
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
  }, [user, planType, usageCount, isWebPlatform]);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    // On native: Premium Pro/Ultra users always can analyze
    if (!isWebPlatform && (planType === 'pro' || planType === 'ultra')) {
      return true;
    }

    await fetchUsage();
    return usageCount < dailyLimit;
  }, [planType, fetchUsage, usageCount, dailyLimit, isWebPlatform]);

  return {
    canAnalyze,
    usageCount,
    dailyLimit,
    remaining,
    isLoading: isLoading || premiumLoading,
    incrementUsage,
    checkLimit,
    refetch: fetchUsage,
    // Platform info
    isWebPlatform,
    showAppDownloadPrompt,
  };
};
