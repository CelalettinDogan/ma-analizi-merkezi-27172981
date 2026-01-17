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
  syncMatches: () => Promise<void>;
}

interface MatchesResponse {
  matches: Match[];
}

interface CachedMatch {
  id: number;
  match_id: number;
  competition_code: string;
  competition_name: string | null;
  home_team_id: number | null;
  home_team_name: string;
  home_team_crest: string | null;
  away_team_id: number | null;
  away_team_name: string;
  away_team_crest: string | null;
  utc_date: string;
  status: string;
  matchday: number | null;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  raw_data: Record<string, unknown> | null;
  updated_at: string;
}

// Transform cached match to Match type
const transformCachedMatch = (cached: CachedMatch): Match => ({
  id: cached.match_id,
  competition: {
    id: 0,
    name: cached.competition_name || '',
    code: cached.competition_code,
    emblem: '',
    area: {
      id: 0,
      name: '',
      code: '',
      flag: '',
    },
  },
  homeTeam: {
    id: cached.home_team_id || 0,
    name: cached.home_team_name,
    shortName: cached.home_team_name,
    tla: cached.home_team_name.substring(0, 3).toUpperCase(),
    crest: cached.home_team_crest || '',
  },
  awayTeam: {
    id: cached.away_team_id || 0,
    name: cached.away_team_name,
    shortName: cached.away_team_name,
    tla: cached.away_team_name.substring(0, 3).toUpperCase(),
    crest: cached.away_team_crest || '',
  },
  utcDate: cached.utc_date,
  status: cached.status as Match['status'],
  matchday: cached.matchday || 1,
  score: {
    winner: cached.winner as 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null,
    fullTime: {
      home: cached.home_score,
      away: cached.away_score,
    },
    halfTime: {
      home: null,
      away: null,
    },
  },
});

// Centralized data fetching for homepage with database cache
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

  // Trigger sync-matches edge function
  const syncMatches = useCallback(async () => {
    console.log('[useHomeData] Triggering sync-matches...');
    try {
      const { data, error } = await supabase.functions.invoke('sync-matches');
      if (error) {
        console.error('[useHomeData] Sync error:', error);
      } else {
        console.log('[useHomeData] Sync result:', data);
      }
    } catch (e) {
      console.error('[useHomeData] Sync exception:', e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00Z`;
      const tomorrowStart = new Date(new Date(today).getTime() + 86400000).toISOString();

      // Fetch ALL data from database in parallel (no rate limit!)
      const [
        todayCountResult,
        overallStatsResult,
        premiumStatsResult,
        cachedMatchesResult,
      ] = await Promise.all([
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
        // Read matches from cached_matches table (rate limit free!)
        supabase
          .from('cached_matches')
          .select('*')
          .in('status', ['SCHEDULED', 'TIMED'])
          .gte('utc_date', todayStart)
          .lt('utc_date', tomorrowStart)
          .order('utc_date', { ascending: true }),
      ]);

      // Transform cached matches to Match type
      const cachedMatches = (cachedMatchesResult.data as CachedMatch[] || [])
        .map(transformCachedMatch);

      // If no cached data, trigger sync and try API as fallback
      if (cachedMatches.length === 0) {
        console.log('[useHomeData] No cached matches, triggering sync...');
        
        // Trigger sync in background (don't await)
        syncMatches();
        
        // Try API as fallback (one attempt)
        try {
          const response = await footballApiRequest<MatchesResponse>({
            action: 'matches',
            dateFrom: today,
            dateTo: today,
            status: 'SCHEDULED,TIMED',
          });

          const allowedCodes = new Set<string>(SUPPORTED_COMPETITIONS.map(c => c.code));
          const apiMatches = (response?.matches || [])
            .filter(m => allowedCodes.has(m.competition?.code))
            .filter(m => m.status === 'TIMED' || m.status === 'SCHEDULED')
            .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
          
          setTodaysMatches(apiMatches);
        } catch (e) {
          console.warn('[useHomeData] API fallback also failed:', e);
          setTodaysMatches([]);
        }
      } else {
        setTodaysMatches(cachedMatches);
      }

      // Live matches still need API (real-time requirement)
      let liveData: Match[] = [];
      try {
        const response = await footballApiRequest<MatchesResponse>({
          action: 'live',
        });
        liveData = response?.matches || [];
      } catch (e) {
        console.warn('[useHomeData] Live matches fetch failed:', e);
      }

      setStats({
        todayPredictions: todayCountResult.count || 0,
        accuracy: Math.round(overallStatsResult.data?.accuracy_percentage || 0),
        premiumAccuracy: Math.round(premiumStatsResult.data?.premium_accuracy || 0),
        liveCount: liveData.length,
      });

      setLiveMatches(liveData);

    } catch (e) {
      console.error('[useHomeData] Error fetching home data:', e);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [syncMatches]);

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
    syncMatches,
  };
};
