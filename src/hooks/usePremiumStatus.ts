import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlanType } from '@/constants/accessLevels';

interface PremiumSubscription {
  id: string;
  plan_type: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

interface UsePremiumStatusReturn {
  isPremium: boolean;
  planType: PlanType;
  subscription: PremiumSubscription | null;
  isLoading: boolean;
  daysRemaining: number | null;
  refetch: () => void;
}

/**
 * Database plan_type'ı frontend PlanType'a çevirir
 * 
 * Mapping:
 * - "basic", "temel", "premium_basic" → "premium_basic"
 * - "plus", "orta", "premium_plus" → "premium_plus"
 * - "pro", "premium", "premium_pro" → "premium_pro"
 * - null veya subscription yok → "free"
 */
const getPlanTypeFromSubscription = (subscription: PremiumSubscription | null): PlanType => {
  if (!subscription) return 'free';
  
  const planType = subscription.plan_type?.toLowerCase() || '';
  
  // Premium Pro (en yüksek)
  if (planType.includes('pro') || planType.includes('premium_pro') || planType.includes('ultra')) {
    return 'premium_pro';
  }
  
  // Premium Plus (orta)
  if (planType.includes('plus') || planType.includes('premium_plus') || planType.includes('orta')) {
    return 'premium_plus';
  }
  
  // Premium Basic (temel)
  if (planType.includes('basic') || planType.includes('temel') || planType.includes('premium_basic')) {
    return 'premium_basic';
  }
  
  // Default premium = Basic
  return 'premium_basic';
};

export const usePremiumStatus = (): UsePremiumStatusReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPremiumStatus = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching premium status:', error);
      }

      setSubscription(data || null);
    } catch (e) {
      console.error('Error fetching premium status:', e);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPremiumStatus();
  }, [fetchPremiumStatus]);

  const isPremium = !!subscription;
  const planType = getPlanTypeFromSubscription(subscription);

  const daysRemaining = subscription 
    ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    isPremium,
    planType,
    subscription,
    isLoading,
    daysRemaining,
    refetch: fetchPremiumStatus,
  };
};
