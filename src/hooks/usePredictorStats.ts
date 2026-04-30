import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PredictorStats {
  total_predictions: number;
  verified_predictions: number;
  correct_predictions: number;
  accuracy: number | null;
}

export type PredictorRank = 'rookie' | 'amateur' | 'analyst' | 'expert' | 'master';

const RANKS: { min: number; minVol: number; rank: PredictorRank }[] = [
  { min: 75, minVol: 50, rank: 'master' },
  { min: 65, minVol: 30, rank: 'expert' },
  { min: 55, minVol: 15, rank: 'analyst' },
  { min: 40, minVol: 5, rank: 'amateur' },
  { min: 0, minVol: 0, rank: 'rookie' },
];

export const getRank = (accuracy: number | null, verified: number): PredictorRank => {
  if (accuracy === null || verified < 5) return 'rookie';
  for (const r of RANKS) {
    if (accuracy >= r.min && verified >= r.minVol) return r.rank;
  }
  return 'rookie';
};

export const RANK_CONFIG: Record<PredictorRank, { gradient: string; icon: string }> = {
  rookie: { gradient: 'from-slate-400 to-slate-500', icon: '🌱' },
  amateur: { gradient: 'from-blue-400 to-blue-600', icon: '📊' },
  analyst: { gradient: 'from-emerald-400 to-emerald-600', icon: '🎯' },
  expert: { gradient: 'from-amber-400 to-orange-500', icon: '🏆' },
  master: { gradient: 'from-purple-400 to-pink-500', icon: '👑' },
};

export const usePredictorStats = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['predictor-stats', user?.id],
    queryFn: async (): Promise<PredictorStats> => {
      const { data, error } = await supabase.rpc('get_my_predictor_stats') as { data: PredictorStats | null; error: any };
      if (error) throw error;
      return data ?? { total_predictions: 0, verified_predictions: 0, correct_predictions: 0, accuracy: null };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const stats = data ?? { total_predictions: 0, verified_predictions: 0, correct_predictions: 0, accuracy: null };
  const rank = getRank(stats.accuracy, stats.verified_predictions);

  return { stats, rank, isLoading };
};
