import { useState, useEffect, useCallback } from 'react';
import { Match, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { footballApiRequest } from '@/services/apiRequestManager';

interface HomeStats {
  liveCount: number;
  todayPredictions: number;
  accuracy: number;
  premiumAccuracy: number;
}

interface HomeData {
  stats: HomeStats;
  liveMatches: Match[];
  todaysMatches: Match[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface MatchesResponse {
  matches: Match[];
}

// Centralized data fetching for homepage with rate limit protection
export const useHomeData = (): HomeData => {
  const [stats, setStats] = useState<HomeStats>({
    liveCount: 0,
    todayPredictions: 0,
    accuracy: 0,
    premiumAccuracy: 0,
  });
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todaysMatches, setTodaysMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch database stats in parallel (no rate limit - direct Supabase)
      const [todayCountResult, overallStatsResult, premiumStatsResult] = await Promise.all([
        supabase
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today),
        supabase
          .from('overall_stats')
          .select('accuracy_percentage')
          .single(),
        supabase
          .from('ml_model_stats')
          .select('premium_accuracy')
          .limit(1)
          .maybeSingle(),
      ]);

      // Fetch live matches via centralized API manager (handles rate limiting)
      let liveData: Match[] = [];
      try {
        const response = await footballApiRequest<MatchesResponse>({
          action: 'live',
        });
        liveData = response?.matches || [];
      } catch (e) {
        console.warn('Live matches fetch failed:', e);
      }

      // Fetch today's upcoming matches in ONE request (rate-limit friendly)
      // Note: Football-Data frequently uses TIMED for not-started matches; include both.
      let scheduledMatches: Match[] = [];

      try {
        const response = await footballApiRequest<MatchesResponse>({
          action: 'matches',
          dateFrom: today,
          dateTo: today,
          status: 'SCHEDULED,TIMED',
        });

        const allowedCodes = new Set<string>(SUPPORTED_COMPETITIONS.map(c => c.code));
        scheduledMatches = (response?.matches || [])
          .filter(m => allowedCodes.has(m.competition?.code))
          .filter(m => m.status === 'TIMED' || m.status === 'SCHEDULED')
          .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
      } catch (e) {
        console.warn('Today matches fetch failed:', e);
      }

      setStats({
        todayPredictions: todayCountResult.count || 0,
        accuracy: Math.round(overallStatsResult.data?.accuracy_percentage || 0),
        premiumAccuracy: Math.round(premiumStatsResult.data?.premium_accuracy || 0),
        liveCount: liveData.length,
      });

      setLiveMatches(liveData);
      setTodaysMatches(scheduledMatches);

    } catch (e) {
      console.error('Error fetching home data:', e);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    liveMatches,
    todaysMatches,
    isLoading,
    error,
    refetch: fetchData,
  };
};
