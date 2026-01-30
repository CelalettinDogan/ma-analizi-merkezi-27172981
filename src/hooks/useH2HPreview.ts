import { useState, useEffect, useCallback, useRef } from 'react';
import { footballApiRequest, hasCachedData } from '@/services/apiRequestManager';

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

// Track failed requests to avoid repeated attempts
const failedRequests = new Set<string>();
const FAILED_REQUEST_COOLDOWN = 60000; // 1 minute cooldown for failed requests

export function useH2HPreview(matchId: number | null, homeTeam: string, awayTeam: string) {
  const [data, setData] = useState<H2HData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const cacheKey = matchId ? `match-${matchId}` : `${homeTeam}-${awayTeam}`;

  const fetchH2H = useCallback(async () => {
    if (!matchId) return;
    
    // Check local cache first
    if (h2hCache[cacheKey]) {
      setData(h2hCache[cacheKey]);
      return;
    }

    // Check if this request recently failed (rate limit protection)
    if (failedRequests.has(cacheKey)) {
      return;
    }

    // Check if we have cached data in apiRequestManager
    const hasApiCache = hasCachedData({ action: 'head2head', matchId });
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await footballApiRequest<{
        matches?: Array<{
          utcDate?: string;
          homeTeam?: { name?: string };
          awayTeam?: { name?: string };
          score?: { fullTime?: { home?: number; away?: number } };
        }>;
        aggregates?: {
          homeTeam?: { wins?: number; draws?: number };
          awayTeam?: { wins?: number };
        };
      }>({ action: 'head2head', matchId });

      if (response?.matches && Array.isArray(response.matches)) {
        const matches = response.matches;
        
        // Calculate wins/draws from perspective of homeTeam
        let homeWins = 0;
        let awayWins = 0;
        let draws = 0;

        const lastMatches = matches.slice(0, 10).map((m) => {
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
      console.warn('H2H fetch failed (gracefully degrading):', err);
      
      // Mark as failed to prevent repeated attempts
      failedRequests.add(cacheKey);
      setTimeout(() => failedRequests.delete(cacheKey), FAILED_REQUEST_COOLDOWN);
      
      // Don't show error to user, just gracefully degrade
      h2hCache[cacheKey] = null;
      if (mountedRef.current) {
        setError('H2H verisi yüklenemedi');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
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

  return { data, isLoading, error };
}

// Batch fetch for multiple matches (more efficient) - disabled for rate limit protection
// This function is kept for backwards compatibility but now just uses the cache check
export async function prefetchH2HForMatches(matchIds: number[]): Promise<void> {
  // Filter out already cached matches
  const uncachedIds = matchIds.filter(id => !h2hCache[`match-${id}`]);
  
  if (uncachedIds.length === 0) return;

  // Only fetch the first match to avoid rate limits
  // Individual H2H requests will be made on-demand with rate limiting
  const firstId = uncachedIds[0];
  
  try {
    const response = await footballApiRequest<{
      matches?: Array<{
        utcDate?: string;
        homeTeam?: { name?: string };
        awayTeam?: { name?: string };
        score?: { fullTime?: { home?: number; away?: number } };
      }>;
      aggregates?: {
        homeTeam?: { wins?: number; draws?: number };
        awayTeam?: { wins?: number };
      };
    }>({ action: 'head2head', matchId: firstId });

    if (response?.matches) {
      const matches = response.matches;
      const lastMatches = matches.slice(0, 5).map((m) => ({
        date: m.utcDate?.split('T')[0] || '',
        homeTeam: m.homeTeam?.name || '',
        awayTeam: m.awayTeam?.name || '',
        score: `${m.score?.fullTime?.home ?? 0}-${m.score?.fullTime?.away ?? 0}`
      }));

      h2hCache[`match-${firstId}`] = {
        homeWins: response.aggregates?.homeTeam?.wins ?? 0,
        awayWins: response.aggregates?.awayTeam?.wins ?? 0,
        draws: response.aggregates?.homeTeam?.draws ?? 0,
        lastMatches
      };
    }
  } catch (err) {
    console.warn(`Failed to prefetch H2H for match ${firstId}:`, err);
  }
}

// Get cached H2H data synchronously
export function getCachedH2H(matchId: number): H2HData | null {
  return h2hCache[`match-${matchId}`] ?? null;
}

// Clear failed requests cache (for testing)
export function clearH2HFailedCache(): void {
  failedRequests.clear();
}
