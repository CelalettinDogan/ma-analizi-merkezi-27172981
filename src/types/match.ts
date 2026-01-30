export interface MatchInput {
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  matchId?: number; // Optional match ID for real H2H API calls
  homeTeamCrest?: string;
  awayTeamCrest?: string;
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
  isAIPowered?: boolean;
  aiConfidence?: number;
  mathConfidence?: number;
}

export interface MatchInsights {
  homeFormScore?: number;
  awayFormScore?: number;
  homeMomentum?: number;
  awayMomentum?: number;
  isDerby?: boolean;
  matchImportance?: 'critical' | 'high' | 'medium' | 'low';
  homeCleanSheetRatio?: number;
  awayCleanSheetRatio?: number;
  homeAttackIndex?: number;
  awayAttackIndex?: number;
}

export interface MatchContext {
  matchImportance: 'critical' | 'high' | 'medium' | 'low';
  seasonPhase: 'early' | 'mid' | 'late' | 'final';
  isDerby: boolean;
  homeRestDays?: number;
  awayRestDays?: number;
  homeMomentum?: number;
  awayMomentum?: number;
  contextTags?: string[];
}

export interface TeamPower {
  attackIndex: number;
  defenseIndex: number;
  overallPower: number;
  formScore: number;
}

export interface ScoreProbability {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

export interface GoalLineProbabilities {
  over05: number;
  over15: number;
  over25: number;
  over35: number;
  under05: number;
  under15: number;
  under25: number;
  under35: number;
}

export interface PoissonData {
  scoreProbabilities: ScoreProbability[];
  goalLineProbabilities: GoalLineProbabilities;
  bttsProbability: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
}

export interface SimilarMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  league: string;
  similarityScore: number;
}

export interface SimilarMatchStats {
  homeWinRate: number;
  drawRate: number;
  awayWinRate: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  bttsRate: number;
  over25Rate: number;
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
  isAIEnhanced?: boolean;
  // New advanced data
  insights?: MatchInsights;
  context?: MatchContext;
  homePower?: TeamPower;
  awayPower?: TeamPower;
  poissonData?: PoissonData;
  similarMatches?: SimilarMatch[];
  similarMatchStats?: SimilarMatchStats;
}
