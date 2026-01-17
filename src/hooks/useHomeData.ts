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

      // Fetch today's scheduled matches from ALL leagues
      // The centralized manager handles rate limiting (7s intervals) and caching (5min)
      const scheduledMatches: Match[] = [];
      
      // Queue all league requests in parallel - the manager will process them sequentially
      const matchPromises = SUPPORTED_COMPETITIONS.map(league => 
        footballApiRequest<MatchesResponse>({
          action: 'matches',
          competitionCode: league.code,
          status: 'SCHEDULED',
          dateFrom: today,
          dateTo: today,
        }).catch(e => {
          console.warn(`Matches fetch failed for ${league.code}:`, e);
          return { matches: [] } as MatchesResponse;
        })
      );

      const results = await Promise.all(matchPromises);
      results.forEach(result => {
        if (result?.matches) {
          scheduledMatches.push(...result.matches);
        }
      });

      // Sort by time
      scheduledMatches.sort((a, b) => 
        new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
      );

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
