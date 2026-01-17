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
import { footballApiRequest } from '@/services/apiRequestManager';

// Re-export the centralized request function for backward compatibility
export { footballApiRequest } from '@/services/apiRequestManager';

export async function getCompetitions() {
  return SUPPORTED_COMPETITIONS;
}

export async function getTeams(competitionCode: CompetitionCode): Promise<Team[]> {
  try {
    const response = await footballApiRequest<TeamsResponse>({
      action: 'teams',
      competitionCode,
    });
    return response?.teams || [];
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }
}

export async function getStandings(competitionCode: CompetitionCode): Promise<Standing[]> {
  try {
    const response = await footballApiRequest<StandingsResponse>({
      action: 'standings',
      competitionCode,
    });
    return response?.standings?.[0]?.table || [];
  } catch (error) {
    console.error('Failed to fetch standings:', error);
    return [];
  }
}

export async function getUpcomingMatches(
  competitionCode: CompetitionCode,
  days: number = 7
): Promise<Match[]> {
  try {
    const dateFrom = new Date().toISOString().split('T')[0];
    const dateTo = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await footballApiRequest<MatchesResponse>({
      action: 'matches',
      competitionCode,
      dateFrom,
      dateTo,
      status: 'SCHEDULED',
    });

    return response?.matches || [];
  } catch (error) {
    console.error('Failed to fetch upcoming matches:', error);
    return [];
  }
}

export async function getLiveMatches(
  competitionCode?: CompetitionCode
): Promise<Match[]> {
  try {
    const response = await footballApiRequest<MatchesResponse>({
      action: 'live',
      competitionCode,
    });
    return response?.matches || [];
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    return [];
  }
}

export async function getFinishedMatches(
  competitionCode: CompetitionCode,
  days: number = 30
): Promise<Match[]> {
  try {
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await footballApiRequest<MatchesResponse>({
      action: 'matches',
      competitionCode,
      dateFrom,
      dateTo,
      status: 'FINISHED',
    });

    return response?.matches || [];
  } catch (error) {
    console.error('Failed to fetch finished matches:', error);
    return [];
  }
}

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
