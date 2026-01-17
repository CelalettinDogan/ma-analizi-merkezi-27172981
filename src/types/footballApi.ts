// Football-Data.org API Types

export interface Competition {
  id: number;
  name: string;
  code: string;
  emblem: string;
  area: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Match {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  matchday: number;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
  competition: Competition;
}

export interface Standing {
  position: number;
  team: Team;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingsResponse {
  competition: Competition;
  standings: {
    stage: string;
    type: string;
    table: Standing[];
  }[];
}

export interface MatchesResponse {
  matches: Match[];
  resultSet: {
    count: number;
    first: string;
    last: string;
    played: number;
  };
}

export interface TeamsResponse {
  teams: Team[];
  count: number;
}

// API Error Response
export interface ApiError {
  message: string;
  errorCode: number;
}

// Supported Competitions (Free Tier)
export const SUPPORTED_COMPETITIONS = [
  { code: 'PL', name: 'Premier League', country: 'İngiltere', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'BL1', name: 'Bundesliga', country: 'Almanya', flag: '🇩🇪' },
  { code: 'PD', name: 'La Liga', country: 'İspanya', flag: '🇪🇸' },
  { code: 'SA', name: 'Serie A', country: 'İtalya', flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1', country: 'Fransa', flag: '🇫🇷' },
  { code: 'CL', name: 'Şampiyonlar Ligi', country: 'Avrupa', flag: '🇪🇺' },
] as const;

export type CompetitionCode = typeof SUPPORTED_COMPETITIONS[number]['code'];
