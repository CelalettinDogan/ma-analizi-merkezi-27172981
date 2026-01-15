export interface MatchInput {
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
}

export interface TeamStats {
  form: string[];
  homePerformance?: { wins: number; draws: number; losses: number };
  awayPerformance?: { wins: number; draws: number; losses: number };
  goalsScored: number;
  goalsConceded: number;
}

export interface HeadToHead {
  lastMatches: {
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
  }[];
  homeWins: number;
  awayWins: number;
  draws: number;
}

export interface Prediction {
  type: string;
  prediction: string;
  confidence: 'düşük' | 'orta' | 'yüksek';
  reasoning: string;
}

export interface MatchAnalysis {
  input: MatchInput;
  homeTeamStats: TeamStats;
  awayTeamStats: TeamStats;
  headToHead: HeadToHead;
  predictions: Prediction[];
  tacticalAnalysis: string;
  keyFactors: string[];
  injuries: { home: string[]; away: string[] };
}
