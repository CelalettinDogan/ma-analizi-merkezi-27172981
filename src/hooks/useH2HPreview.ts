import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface H2HData {
  homeWins: number;
  awayWins: number;
  draws: number;
  lastMatches: {
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
  }[];
}

interface H2HCache {
  [key: string]: H2HData | null;
}

// In-memory cache for H2H data to avoid repeated API calls
const h2hCache: H2HCache = {};

// Global request tracking to prevent rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 7000; // 7 seconds between requests (safe for 10 req/min limit)
let pendingRequest: Promise<void> | null = null;

export function useH2HPreview(matchId: number | null, homeTeam: string, awayTeam: string) {
  const [data, setData] = useState<H2HData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const cacheKey = matchId ? `match-${matchId}` : `${homeTeam}-${awayTeam}`;

  const fetchH2H = useCallback(async () => {
    if (!matchId) return;
    
    // Check cache first
    if (h2hCache[cacheKey]) {
      setData(h2hCache[cacheKey]);
      return;
    }

    // Rate limit protection - wait if we made a request recently
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      // Wait for the pending request or skip
      if (pendingRequest) {
        await pendingRequest;
        // Check cache again after waiting
        if (h2hCache[cacheKey]) {
          setData(h2hCache[cacheKey]);
          return;
        }
      }
      
      // Still need to wait more
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    setIsLoading(true);
    lastRequestTime = Date.now();
    
    const fetchPromise = (async () => {
      try {
        const { data: response, error } = await supabase.functions.invoke('football-api', {
          body: { action: 'head2head', matchId }
        });

        if (error) throw error;

        if (response?.matches && Array.isArray(response.matches)) {
          const matches = response.matches;
          
          // Calculate wins/draws from perspective of homeTeam
          let homeWins = 0;
          let awayWins = 0;
          let draws = 0;

          const lastMatches = matches.slice(0, 10).map((m: any) => {
            const hTeam = m.homeTeam?.name || '';
            const aTeam = m.awayTeam?.name || '';
            const hScore = m.score?.fullTime?.home ?? 0;
            const aScore = m.score?.fullTime?.away ?? 0;

            // Determine winner from homeTeam perspective
            if (hScore === aScore) {
              draws++;
            } else if (hTeam === homeTeam) {
              if (hScore > aScore) homeWins++;
              else awayWins++;
            } else if (aTeam === homeTeam) {
              if (aScore > hScore) homeWins++;
              else awayWins++;
            } else if (hTeam === awayTeam) {
              if (hScore > aScore) awayWins++;
              else homeWins++;
            } else if (aTeam === awayTeam) {
              if (aScore > hScore) awayWins++;
              else homeWins++;
            }

            return {
              date: m.utcDate?.split('T')[0] || '',
              homeTeam: hTeam,
              awayTeam: aTeam,
              score: `${hScore}-${aScore}`
            };
          });

          const h2hData: H2HData = {
            homeWins,
            awayWins,
            draws,
            lastMatches
          };

          h2hCache[cacheKey] = h2hData;
          if (mountedRef.current) {
            setData(h2hData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch H2H preview:', err);
        h2hCache[cacheKey] = null;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
        pendingRequest = null;
      }
    })();

    pendingRequest = fetchPromise;
    await fetchPromise;
  }, [matchId, cacheKey, homeTeam, awayTeam]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (matchId) {
      fetchH2H();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [matchId, fetchH2H]);

  return { data, isLoading };
}

// Batch fetch for multiple matches (more efficient)
export async function prefetchH2HForMatches(matchIds: number[]): Promise<void> {
  // Filter out already cached matches
  const uncachedIds = matchIds.filter(id => !h2hCache[`match-${id}`]);
  
  if (uncachedIds.length === 0) return;

  // Fetch first 5 matches only to avoid rate limits
  const idsToFetch = uncachedIds.slice(0, 5);
  
  await Promise.allSettled(
    idsToFetch.map(async (matchId) => {
      try {
        const { data: response } = await supabase.functions.invoke('football-api', {
          body: { action: 'head2head', matchId }
        });

        if (response?.matches) {
          const matches = response.matches;
          const lastMatches = matches.slice(0, 5).map((m: any) => ({
            date: m.utcDate?.split('T')[0] || '',
            homeTeam: m.homeTeam?.name || '',
            awayTeam: m.awayTeam?.name || '',
            score: `${m.score?.fullTime?.home ?? 0}-${m.score?.fullTime?.away ?? 0}`
          }));

          h2hCache[`match-${matchId}`] = {
            homeWins: response.aggregates?.homeTeam?.wins ?? 0,
            awayWins: response.aggregates?.awayTeam?.wins ?? 0,
            draws: response.aggregates?.homeTeam?.draws ?? 0,
            lastMatches
          };
        }
      } catch (err) {
        console.error(`Failed to prefetch H2H for match ${matchId}:`, err);
      }
    })
  );
}

// Get cached H2H data synchronously
export function getCachedH2H(matchId: number): H2HData | null {
  return h2hCache[`match-${matchId}`] ?? null;
}
