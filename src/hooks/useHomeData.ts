import { useState, useEffect, useCallback, useRef } from 'react';
import { Match, SUPPORTED_COMPETITIONS, CompetitionCode } from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { addDays, startOfDay, endOfDay } from 'date-fns';

interface HomeStats {
  liveCount: number;
  totalPredictions: number;
  accuracy: number;
  premiumAccuracy: number;
}

interface HomeData {
  stats: HomeStats;
  liveMatches: Match[];
  todaysMatches: Match[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

// Auto-refresh interval (5 minutes)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

// Transform cached match to Match type
const transformCachedMatch = (cached: {
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
  winner?: string | null;
}): Match => ({
  id: cached.match_id,
  competition: {
    id: 0,
    name: cached.competition_name || '',
    code: cached.competition_code as CompetitionCode,
    emblem: '',
    area: { id: 0, name: '', code: '', flag: '' },
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
    winner: (cached.winner as 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW') || null,
    fullTime: { home: cached.home_score, away: cached.away_score },
    halfTime: { home: null, away: null },
  },
});

// Transform cached live match to Match type
const transformCachedLiveMatch = (cached: {
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
  half_time_home: number | null;
  half_time_away: number | null;
}): Match => ({
  id: cached.match_id,
  competition: {
    id: 0,
    name: cached.competition_name || '',
    code: cached.competition_code as CompetitionCode,
    emblem: '',
    area: { id: 0, name: '', code: '', flag: '' },
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
    winner: null,
    fullTime: { home: cached.home_score, away: cached.away_score },
    halfTime: { home: cached.half_time_home, away: cached.half_time_away },
  },
});

// Centralized data fetching for homepage - ALL from database cache (no rate limits!)
export const useHomeData = (): HomeData => {
  const [stats, setStats] = useState<HomeStats>({
    liveCount: 0,
    totalPredictions: 0,
    accuracy: 0,
    premiumAccuracy: 0,
  });
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todaysMatches, setTodaysMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const isMountedRef = useRef(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Note: Manual sync removed - pg_cron handles sync automatically every 15-30 minutes

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const tomorrowStart = startOfDay(addDays(today, 1)).toISOString();
      const threeDaysLater = endOfDay(addDays(today, 3)).toISOString();
      const supportedCodes = SUPPORTED_COMPETITIONS.map(c => c.code);
      const todayDateStr = today.toISOString().split('T')[0];

      // Fetch ALL data from database cache in parallel (NO RATE LIMITS!)
      const [
        overallStatsResult,
        premiumPredictionsResult,
        cachedTodayMatchesResult,
        cachedUpcomingMatchesResult,
        cachedLiveMatchesResult,
      ] = await Promise.all([
        supabase
          .from('overall_stats')
          .select('total_predictions, accuracy_percentage')
          .single(),
        // Premium stats: same logic as Dashboard (from predictions table)
        supabase
          .from('predictions')
          .select('is_correct')
          .eq('is_premium', true)
          .eq('is_primary', true)
          .not('is_correct', 'is', null),
        // Today's matches from cached_matches table (only SCHEDULED and TIMED - not FINISHED)
        supabase
          .from('cached_matches')
          .select('*')
          .in('status', ['SCHEDULED', 'TIMED'])
          .in('competition_code', supportedCodes)
          .gte('utc_date', todayStart)
          .lt('utc_date', tomorrowStart)
          .order('utc_date', { ascending: true }),
        // Upcoming matches (next 3 days) as fallback
        supabase
          .from('cached_matches')
          .select('*')
          .in('status', ['SCHEDULED', 'TIMED'])
          .in('competition_code', supportedCodes)
          .gte('utc_date', todayStart)
          .lt('utc_date', threeDaysLater)
          .order('utc_date', { ascending: true })
          .limit(20),
        // Live matches from cached_live_matches table
        supabase
          .from('cached_live_matches')
          .select('*')
          .in('competition_code', supportedCodes)
          .order('utc_date', { ascending: true }),
      ]);

      if (!isMountedRef.current) return;

      // Transform cached matches
      const todayMatches = (cachedTodayMatchesResult.data || []).map(transformCachedMatch);
      const upcomingMatches = (cachedUpcomingMatchesResult.data || []).map(transformCachedMatch);
      const liveData = (cachedLiveMatchesResult.data || []).map(transformCachedLiveMatch);

      // Use today's matches if available, otherwise fall back to upcoming matches
      const matchesToShow = todayMatches.length > 0 ? todayMatches : upcomingMatches;

      // Note: If no cached data, pg_cron will populate it within 15-30 minutes
      // No manual sync needed - reduces Cloud Balance usage

      setTodaysMatches(matchesToShow);
      setLiveMatches(liveData);
      setLastUpdated(new Date());

      // Calculate premium accuracy from predictions (same logic as Dashboard)
      const premiumData = premiumPredictionsResult.data || [];
      const premiumTotal = premiumData.length;
      const premiumCorrect = premiumData.filter(p => p.is_correct === true).length;
      const premiumAccuracy = premiumTotal > 0 ? (premiumCorrect / premiumTotal) * 100 : 0;

      setStats({
        totalPredictions: overallStatsResult.data?.total_predictions || 0,
        accuracy: Math.round(overallStatsResult.data?.accuracy_percentage || 0),
        premiumAccuracy: Math.round(premiumAccuracy),
        liveCount: liveData.length,
      });

    } catch (e) {
      console.error('[useHomeData] Error fetching home data:', e);
      if (isMountedRef.current) {
        setError('Veriler yüklenirken bir hata oluştu');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      console.log('[useHomeData] Auto-refreshing data...');
      fetchData();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData]);

  // Realtime subscription for cached_matches changes
  useEffect(() => {
    const channel = supabase
      .channel('cached_matches_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cached_matches',
        },
        (payload) => {
          console.log('[useHomeData] Realtime update received:', payload.eventType);
          // Debounce: only refetch if not already loading
          if (!isLoading) {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    stats,
    liveMatches,
    todaysMatches,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
};