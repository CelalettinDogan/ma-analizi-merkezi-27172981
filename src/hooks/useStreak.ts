import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  newly_granted?: Array<{ day: number; type: string; quantity: number }>;
}

export const useStreak = () => {
  const { user } = useAuth();
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

  // Surface a "milestone reached" UI signal whenever the server reports newly granted rewards
  useEffect(() => {
    if (!streak?.newly_granted?.length) return;
    const highest = streak.newly_granted.reduce((max, r) => Math.max(max, r.day), 0);
    if (highest > 0) setMilestone(highest);
  }, [streak]);

  const dismissMilestone = () => setMilestone(null);

  return {
    streak: streak ?? { current_streak: 0, longest_streak: 0, last_activity_date: null },
    isLoading,
    milestone,
    dismissMilestone,
  };
};
