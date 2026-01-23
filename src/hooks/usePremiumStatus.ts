import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumSubscription {
  id: string;
  plan_type: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

interface UsePremiumStatusReturn {
  isPremium: boolean;
  subscription: PremiumSubscription | null;
  isLoading: boolean;
  daysRemaining: number | null;
  refetch: () => void;
}

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

  const daysRemaining = subscription 
    ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    isPremium,
    subscription,
    isLoading,
    daysRemaining,
    refetch: fetchPremiumStatus,
  };
};
