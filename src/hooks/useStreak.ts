import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

const SESSION_KEY = 'streak_updated_today';

export const useStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [milestone, setMilestone] = useState<number | null>(null);

  const { data: streak, isLoading } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async (): Promise<StreakData> => {
      const { data, error } = await supabase.rpc('update_user_streak') as { data: StreakData | null; error: any };
      if (error) throw error;
      return data ?? { current_streak: 0, longest_streak: 0, last_activity_date: null };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Check for milestones
  useEffect(() => {
    if (!streak) return;
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) return;

    const milestones = [3, 7, 14, 30, 60, 100];
    const hit = milestones.find(m => streak.current_streak === m);
    if (hit) {
      setMilestone(hit);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  }, [streak]);

  const dismissMilestone = () => setMilestone(null);

  return {
    streak: streak ?? { current_streak: 0, longest_streak: 0, last_activity_date: null },
    isLoading,
    milestone,
    dismissMilestone,
  };
};
