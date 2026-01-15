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

// Cache for reducing API calls
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function callFootballApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('football-api', {
    body,
  });

  if (error) {
    console.error('Football API Error:', error);
    throw new Error(error.message || 'API çağrısı başarısız');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

export async function getCompetitions() {
  return SUPPORTED_COMPETITIONS;
}

export async function getTeams(competitionCode: CompetitionCode): Promise<Team[]> {
  const cacheKey = `teams-${competitionCode}`;
  const cached = getCached<Team[]>(cacheKey);
  if (cached) return cached;

  const response = await callFootballApi<TeamsResponse>({
    action: 'teams',
    competitionCode,
  });

  setCache(cacheKey, response.teams);
  return response.teams;
}

export async function getStandings(competitionCode: CompetitionCode): Promise<Standing[]> {
  const cacheKey = `standings-${competitionCode}`;
  const cached = getCached<Standing[]>(cacheKey);
  if (cached) return cached;

  const response = await callFootballApi<StandingsResponse>({
    action: 'standings',
    competitionCode,
  });

  const standings = response.standings[0]?.table || [];
  setCache(cacheKey, standings);
  return standings;
}

export async function getUpcomingMatches(
  competitionCode: CompetitionCode,
  days: number = 7
): Promise<Match[]> {
  const cacheKey = `matches-${competitionCode}-${days}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

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
}

export async function getFinishedMatches(
  competitionCode: CompetitionCode,
  days: number = 30
): Promise<Match[]> {
  const cacheKey = `finished-${competitionCode}-${days}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

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
}

export async function getHeadToHead(matchId: number) {
  const cacheKey = `h2h-${matchId}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const response = await callFootballApi<unknown>({
    action: 'head2head',
    matchId,
  });

  setCache(cacheKey, response);
  return response;
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
