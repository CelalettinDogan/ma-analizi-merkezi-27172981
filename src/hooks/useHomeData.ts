import { useState, useEffect, useCallback } from 'react';
import { Match, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';

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

// Centralized data fetching for homepage to avoid rate limiting
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

      // Fetch database stats in parallel (no rate limit)
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

      // Fetch live matches (single API call)
      let liveData: Match[] = [];
      try {
        const { data, error: liveError } = await supabase.functions.invoke('football-api', {
          body: { action: 'live' },
        });
        if (!liveError && data?.matches) {
          liveData = data.matches;
        }
      } catch (e) {
        console.warn('Live matches fetch failed:', e);
      }

      // Wait a bit before fetching scheduled matches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Fetch today's scheduled matches - only from first 2 leagues to minimize API calls
      const scheduledMatches: Match[] = [];
      const competitionsToFetch = SUPPORTED_COMPETITIONS.slice(0, 2);
      
      for (const comp of competitionsToFetch) {
        try {
          const { data, error: matchError } = await supabase.functions.invoke('football-api', {
            body: { 
              action: 'matches', 
              competitionCode: comp.code, 
              status: 'SCHEDULED',
              dateFrom: today,
              dateTo: today
            },
          });

          if (!matchError && data?.matches) {
            scheduledMatches.push(...data.matches);
          }

          // Delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1200));
        } catch (e) {
          console.warn(`Matches fetch failed for ${comp.code}:`, e);
        }
      }

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
