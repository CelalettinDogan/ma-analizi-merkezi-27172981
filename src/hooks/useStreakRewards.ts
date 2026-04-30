import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BonusCredits {
  bonus_analysis: number;
  bonus_chat: number;
  has_streak_badge: boolean;
}

interface StreakReward {
  day: number;
  type: string;
  quantity: number;
}

export const useStreakRewards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current bonus credits
  const { data: bonusCredits, isLoading } = useQuery({
    queryKey: ['bonus-credits', user?.id],
    queryFn: async (): Promise<BonusCredits> => {
      const { data, error } = await supabase.rpc('get_bonus_credits');
      if (error) throw error;
      return (data as unknown as BonusCredits) ?? { bonus_analysis: 0, bonus_chat: 0, has_streak_badge: false };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Grant rewards when streak milestone is reached
  const grantRewards = useMutation({
    mutationFn: async (): Promise<StreakReward[]> => {
      const { data, error } = await supabase.rpc('grant_streak_reward');
      if (error) throw error;
      return (data as unknown as StreakReward[]) ?? [];
    },
    onSuccess: (rewards) => {
      if (rewards.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['bonus-credits'] });
      }
    },
  });

  // Use a bonus credit
  const useBonusCredit = useMutation({
    mutationFn: async (creditType: 'bonus_analysis' | 'bonus_chat'): Promise<boolean> => {
      const { data, error } = await supabase.rpc('use_bonus_credit', { credit_type: creditType });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-credits'] });
    },
  });

  return {
    bonusCredits: bonusCredits ?? { bonus_analysis: 0, bonus_chat: 0, has_streak_badge: false },
    isLoading,
    grantRewards: grantRewards.mutateAsync,
    useBonusCredit: useBonusCredit.mutateAsync,
    hasStreakBadge: bonusCredits?.has_streak_badge ?? false,
  };
};

export default useStreakRewards;
