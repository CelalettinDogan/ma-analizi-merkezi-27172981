import { supabase } from '@/integrations/supabase/client';
import { 
  Match, 
  Standing, 
  Team, 
  MatchesResponse, 
  StandingsResponse, 
  TeamsResponse,
  SUPPORTED_COMPETITIONS,
  CompetitionCode 
} from '@/types/footballApi';

// Cache for reducing API calls - EXTENDED to prevent rate limits
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for most data
const LIVE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for live matches
const STANDINGS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for standings

// Rate limiting to prevent 429 errors (Football-Data.org: 10 req/min)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6500; // 6.5 seconds between requests (safe margin)
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

function getCached<T>(key: string, customDuration?: number): T | null {
  const cached = cache.get(key);
  const duration = customDuration || CACHE_DURATION;
  if (cached && Date.now() - cached.timestamp < duration) {
    console.log(`[Cache HIT] ${key}`);
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      await request();
    }
  }
  isProcessingQueue = false;
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Rate Limit] Waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

async function callFootballApi<T>(body: Record<string, unknown>): Promise<T> {
  await waitForRateLimit();
  
  const { data, error } = await supabase.functions.invoke('football-api', {
    body,
  });

  if (error) {
    console.error('Football API Error:', error);
    throw new Error(error.message || 'API çağrısı başarısız');
  }

  if (data?.error) {
    // Handle rate limit specifically
    if (data.error.includes('429')) {
      console.warn('[Rate Limited] Too many requests, using cached data if available');
      throw new Error('API rate limit exceeded. Please try again in a minute.');
    }
    throw new Error(data.error);
  }

  return data as T;
}

export async function getCompetitions() {
  return SUPPORTED_COMPETITIONS;
}

export async function getTeams(competitionCode: CompetitionCode): Promise<Team[]> {
  const cacheKey = `teams-${competitionCode}`;
  const cached = getCached<Team[]>(cacheKey, STANDINGS_CACHE_DURATION);
  if (cached) return cached;

  try {
    const response = await callFootballApi<TeamsResponse>({
      action: 'teams',
      competitionCode,
    });

    setCache(cacheKey, response.teams);
    return response.teams;
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }
}

export async function getStandings(competitionCode: CompetitionCode): Promise<Standing[]> {
  const cacheKey = `standings-${competitionCode}`;
  // Use longer cache for standings (1 hour)
  const cached = getCached<Standing[]>(cacheKey, STANDINGS_CACHE_DURATION);
  if (cached) return cached;

  try {
    const response = await callFootballApi<StandingsResponse>({
      action: 'standings',
      competitionCode,
    });

    const standings = response.standings[0]?.table || [];
    setCache(cacheKey, standings);
    return standings;
  } catch (error) {
    // Return empty array on rate limit, component should handle gracefully
    console.error('Failed to fetch standings:', error);
    return [];
  }
}

export async function getUpcomingMatches(
  competitionCode: CompetitionCode,
  days: number = 7
): Promise<Match[]> {
  const cacheKey = `matches-${competitionCode}-${days}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  try {
    const dateFrom = new Date().toISOString().split('T')[0];
    const dateTo = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await callFootballApi<MatchesResponse>({
      action: 'matches',
      competitionCode,
      dateFrom,
      dateTo,
      status: 'SCHEDULED',
    });

    setCache(cacheKey, response.matches);
    return response.matches;
  } catch (error) {
    console.error('Failed to fetch upcoming matches:', error);
    return [];
  }
}

export async function getLiveMatches(
  competitionCode?: CompetitionCode
): Promise<Match[]> {
  const cacheKey = `live-${competitionCode || 'all'}`;
  // Use 2-minute cache for live matches to reduce API calls
  const cached = getCached<Match[]>(cacheKey, LIVE_CACHE_DURATION);
  if (cached) return cached;

  try {
    const response = await callFootballApi<MatchesResponse>({
      action: 'matches',
      competitionCode,
      status: 'LIVE',
    });

    setCache(cacheKey, response.matches);
    return response.matches;
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    return [];
  }
}

export async function getFinishedMatches(
  competitionCode: CompetitionCode,
  days: number = 30
): Promise<Match[]> {
  const cacheKey = `finished-${competitionCode}-${days}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  try {
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await callFootballApi<MatchesResponse>({
      action: 'matches',
      competitionCode,
      dateFrom,
      dateTo,
      status: 'FINISHED',
    });

    setCache(cacheKey, response.matches);
    return response.matches;
  } catch (error) {
    console.error('Failed to fetch finished matches:', error);
    return [];
  }
}

export async function getHeadToHead(matchId: number) {
  const cacheKey = `h2h-${matchId}`;
  const cached = getCached<unknown>(cacheKey, STANDINGS_CACHE_DURATION);
  if (cached) return cached;

  try {
    const response = await callFootballApi<unknown>({
      action: 'head2head',
      matchId,
    });

    setCache(cacheKey, response);
    return response;
  } catch (error) {
    console.error('Failed to fetch head to head:', error);
    return null;
  }
}

// Helper to find team's recent form from standings
export function getTeamForm(standings: Standing[], teamId: number): string[] {
  const team = standings.find(s => s.team.id === teamId);
  if (!team?.form) return [];
  
  // Convert form string like "W,D,L,W,W" to array
  return team.form.split(',').map(f => {
    switch (f) {
      case 'W': return 'W';
      case 'D': return 'D';
      case 'L': return 'L';
      default: return 'D';
    }
  });
}

// Calculate team stats from standings
export function calculateTeamStats(standing: Standing) {
  return {
    played: standing.playedGames,
    won: standing.won,
    drawn: standing.draw,
    lost: standing.lost,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    points: standing.points,
    form: standing.form?.split(',') || [],
    avgGoalsScored: standing.goalsFor / standing.playedGames,
    avgGoalsConceded: standing.goalsAgainst / standing.playedGames,
  };
}
