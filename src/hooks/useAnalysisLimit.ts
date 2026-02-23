import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformPremium } from './usePlatformPremium';
import { useUserRole } from './useUserRole';
import { 
  PLAN_ACCESS_LEVELS, 
  hasUnlimitedAnalysis 
} from '@/constants/accessLevels';

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

export const useAnalysisLimit = (): UseAnalysisLimitReturn => {
  const { user } = useAuth();
  const { 
    planType, 
    isLoading: premiumLoading 
  } = usePlatformPremium();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  
  const [usageCount, setUsageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get daily limit from centralized access levels
  const dailyLimit = isAdmin ? 999 : PLAN_ACCESS_LEVELS[planType].dailyAnalysis;
  
  const remaining = Math.max(0, dailyLimit - usageCount);
  const canAnalyze = remaining > 0 || hasUnlimitedAnalysis(planType, isAdmin);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_daily_analysis_usage');

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
    if (!premiumLoading && !roleLoading) {
      fetchUsage();
    }
  }, [fetchUsage, premiumLoading, roleLoading]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Users with unlimited analysis don't need to track usage
    if (hasUnlimitedAnalysis(planType, isAdmin)) {
      return true;
    }

    try {
      const { data, error } = await supabase.rpc('increment_analysis_usage');

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
  }, [user, planType, isAdmin, usageCount]);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    // Users with unlimited analysis always can analyze
    if (hasUnlimitedAnalysis(planType, isAdmin)) {
      return true;
    }

    await fetchUsage();
    return usageCount < dailyLimit;
  }, [planType, isAdmin, fetchUsage, usageCount, dailyLimit]);

  return {
    canAnalyze,
    usageCount,
    dailyLimit,
    remaining,
    isLoading: isLoading || premiumLoading || roleLoading,
    incrementUsage,
    checkLimit,
    refetch: fetchUsage,
  };
};
