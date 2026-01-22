import { 
  Match, 
  Standing, 
  Team, 
  SUPPORTED_COMPETITIONS,
  CompetitionCode 
} from '@/types/footballApi';
import { supabase } from '@/integrations/supabase/client';
import { footballApiRequest } from '@/services/apiRequestManager';

// Re-export the centralized request function for backward compatibility
export { footballApiRequest } from '@/services/apiRequestManager';

export async function getCompetitions() {
  return SUPPORTED_COMPETITIONS;
}

// Get teams from cached_standings table (teams are derived from standings data)
export async function getTeams(competitionCode: CompetitionCode): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('cached_standings')
      .select('team_id, team_name, team_short_name, team_tla, team_crest')
      .eq('competition_code', competitionCode)
      .order('position', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.team_id,
      name: row.team_name,
      shortName: row.team_short_name || row.team_name,
      tla: row.team_tla || '',
      crest: row.team_crest || '',
    }));
  } catch (error) {
    console.error('Failed to fetch teams from cache:', error);
    return [];
  }
}

// Get standings from cached_standings table (NO API CALL!)
export async function getStandings(competitionCode: CompetitionCode): Promise<Standing[]> {
  try {
    const { data, error } = await supabase
      .from('cached_standings')
      .select('*')
      .eq('competition_code', competitionCode)
      .order('position', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
      position: row.position,
      team: {
        id: row.team_id,
        name: row.team_name,
        shortName: row.team_short_name || row.team_name,
        tla: row.team_tla || '',
        crest: row.team_crest || '',
      },
      playedGames: row.played_games ?? 0,
      form: row.form,
      won: row.won ?? 0,
      draw: row.draw ?? 0,
      lost: row.lost ?? 0,
      points: row.points ?? 0,
      goalsFor: row.goals_for ?? 0,
      goalsAgainst: row.goals_against ?? 0,
      goalDifference: row.goal_difference ?? 0,
    }));
  } catch (error) {
    console.error('Failed to fetch standings from cache:', error);
    return [];
  }
}

// Get upcoming matches from cached_matches table (NO API CALL!)
export async function getUpcomingMatches(
  competitionCode: CompetitionCode,
  days: number = 7
): Promise<Match[]> {
  try {
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('cached_matches')
      .select('*')
      .eq('competition_code', competitionCode)
      .in('status', ['SCHEDULED', 'TIMED'])
      .gte('utc_date', now)
      .lte('utc_date', futureDate)
      .order('utc_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(m => ({
      id: m.match_id,
      utcDate: m.utc_date,
      status: m.status as Match['status'],
      matchday: m.matchday ?? 0,
      competition: {
        id: 0,
        code: m.competition_code as CompetitionCode,
        name: m.competition_name || '',
        emblem: '',
        area: { id: 0, name: '', code: '', flag: '' },
      },
      homeTeam: {
        id: m.home_team_id ?? 0,
        name: m.home_team_name,
        shortName: m.home_team_name,
        tla: '',
        crest: m.home_team_crest ?? '',
      },
      awayTeam: {
        id: m.away_team_id ?? 0,
        name: m.away_team_name,
        shortName: m.away_team_name,
        tla: '',
        crest: m.away_team_crest ?? '',
      },
      score: {
        winner: (m.winner as Match['score']['winner']) ?? null,
        fullTime: { home: m.home_score ?? null, away: m.away_score ?? null },
        halfTime: { home: null, away: null },
      },
    }));
  } catch (error) {
    console.error('Failed to fetch upcoming matches from cache:', error);
    return [];
  }
}

// Get live matches from cached_live_matches table (NO API CALL!)
export async function getLiveMatches(
  competitionCode?: CompetitionCode
): Promise<Match[]> {
  try {
    let query = supabase
      .from('cached_live_matches')
      .select('*')
      .order('utc_date', { ascending: true });

    if (competitionCode) {
      query = query.eq('competition_code', competitionCode);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(m => ({
      id: m.match_id,
      utcDate: m.utc_date,
      status: m.status as Match['status'],
      matchday: m.matchday ?? 0,
      minute: m.minute ?? undefined,
      competition: {
        id: 0,
        code: m.competition_code as CompetitionCode,
        name: m.competition_name || '',
        emblem: '',
        area: { id: 0, name: '', code: '', flag: '' },
      },
      homeTeam: {
        id: m.home_team_id ?? 0,
        name: m.home_team_name,
        shortName: m.home_team_name,
        tla: '',
        crest: m.home_team_crest ?? '',
      },
      awayTeam: {
        id: m.away_team_id ?? 0,
        name: m.away_team_name,
        shortName: m.away_team_name,
        tla: '',
        crest: m.away_team_crest ?? '',
      },
      score: {
        winner: null,
        fullTime: { home: m.home_score ?? null, away: m.away_score ?? null },
        halfTime: { home: m.half_time_home ?? null, away: m.half_time_away ?? null },
      },
    }));
  } catch (error) {
    console.error('Failed to fetch live matches from cache:', error);
    return [];
  }
}

// Get finished matches from cached_matches table (NO API CALL!)
export async function getFinishedMatches(
  competitionCode: CompetitionCode,
  days: number = 30
): Promise<Match[]> {
  try {
    const now = new Date().toISOString();
    const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('cached_matches')
      .select('*')
      .eq('competition_code', competitionCode)
      .eq('status', 'FINISHED')
      .gte('utc_date', pastDate)
      .lte('utc_date', now)
      .order('utc_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(m => ({
      id: m.match_id,
      utcDate: m.utc_date,
      status: m.status as Match['status'],
      matchday: m.matchday ?? 0,
      competition: {
        id: 0,
        code: m.competition_code as CompetitionCode,
        name: m.competition_name || '',
        emblem: '',
        area: { id: 0, name: '', code: '', flag: '' },
      },
      homeTeam: {
        id: m.home_team_id ?? 0,
        name: m.home_team_name,
        shortName: m.home_team_name,
        tla: '',
        crest: m.away_team_crest ?? '',
      },
      awayTeam: {
        id: m.away_team_id ?? 0,
        name: m.away_team_name,
        shortName: m.away_team_name,
        tla: '',
        crest: m.away_team_crest ?? '',
      },
      score: {
        winner: (m.winner as Match['score']['winner']) ?? null,
        fullTime: { home: m.home_score ?? null, away: m.away_score ?? null },
        halfTime: { home: null, away: null },
      },
    }));
  } catch (error) {
    console.error('Failed to fetch finished matches from cache:', error);
    return [];
  }
}

// H2H data still needs API call (not cached)
export async function getHeadToHead(matchId: number) {
  try {
    const response = await footballApiRequest<unknown>({
      action: 'head2head',
      matchId,
    });
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
