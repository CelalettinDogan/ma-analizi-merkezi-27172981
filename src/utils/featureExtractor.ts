import { Standing } from '@/types/footballApi';
import { HeadToHead } from '@/types/match';

export interface TeamFeatures {
  name: string;
  position: number;
  points: number;
  formScore: number;
  form: string;
  goalsScored: number;
  goalsConceded: number;
  goalAverage: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface H2HFeatures {
  homeWins: number;
  awayWins: number;
  draws: number;
  totalMatches: number;
}

export interface MatchFeatures {
  homeTeam: TeamFeatures;
  awayTeam: TeamFeatures;
  h2h: H2HFeatures;
  positionDiff: number;
  homeAdvantageScore: number;
  expectedGoals: number;
}

// Form string'ini puan olarak hesapla (son 5 maç)
export function calculateFormScore(form: string | null): number {
  if (!form) return 50;
  
  const results = form.split(',').slice(-5);
  let score = 0;
  
  results.forEach((result, index) => {
    // Son maçlara daha fazla ağırlık ver
    const weight = 1 + (index * 0.2);
    switch (result) {
      case 'W': score += 3 * weight; break;
      case 'D': score += 1 * weight; break;
      case 'L': score += 0; break;
    }
  });
  
  // Normalize to 0-100
  const maxScore = results.length * 3 * 1.8;
  return Math.round((score / maxScore) * 100);
}

// Takım özelliklerini çıkar
export function extractTeamFeatures(standing: Standing): TeamFeatures {
  const games = standing.playedGames || 1;
  const formScore = calculateFormScore(standing.form);
  
  return {
    name: standing.team.name,
    position: standing.position,
    points: standing.points,
    formScore,
    form: standing.form || '',
    goalsScored: standing.goalsFor,
    goalsConceded: standing.goalsAgainst,
    goalAverage: Math.round((standing.goalsFor / games) * 100) / 100,
    wins: standing.won,
    draws: standing.draw,
    losses: standing.lost,
  };
}

// H2H özelliklerini çıkar
export function extractH2HFeatures(h2h: HeadToHead): H2HFeatures {
  return {
    homeWins: h2h.homeWins,
    awayWins: h2h.awayWins,
    draws: h2h.draws,
    totalMatches: h2h.homeWins + h2h.awayWins + h2h.draws,
  };
}

// Ev sahibi avantaj skoru
export function calculateHomeAdvantage(homeStanding: Standing, awayStanding: Standing): number {
  const homePoints = homeStanding.points;
  const awayPoints = awayStanding.points;
  const pointDiff = homePoints - awayPoints;
  const homeBonus = 10;
  return Math.max(-30, Math.min(30, pointDiff + homeBonus));
}

// Beklenen gol hesapla
export function calculateExpectedGoals(homeStanding: Standing, awayStanding: Standing): number {
  const homeGames = homeStanding.playedGames || 1;
  const awayGames = awayStanding.playedGames || 1;
  
  const homeScored = homeStanding.goalsFor / homeGames;
  const homeConceded = homeStanding.goalsAgainst / homeGames;
  const awayScored = awayStanding.goalsFor / awayGames;
  const awayConceded = awayStanding.goalsAgainst / awayGames;
  
  return (homeScored + awayScored + homeConceded + awayConceded) / 2;
}

// Tüm maç özelliklerini çıkar
export function extractMatchFeatures(
  homeStanding: Standing,
  awayStanding: Standing,
  h2h: HeadToHead
): MatchFeatures {
  const homeTeam = extractTeamFeatures(homeStanding);
  const awayTeam = extractTeamFeatures(awayStanding);
  const h2hFeatures = extractH2HFeatures(h2h);
  
  return {
    homeTeam,
    awayTeam,
    h2h: h2hFeatures,
    positionDiff: homeStanding.position - awayStanding.position,
    homeAdvantageScore: calculateHomeAdvantage(homeStanding, awayStanding),
    expectedGoals: calculateExpectedGoals(homeStanding, awayStanding),
  };
}

// Veritabanı için feature objesi oluştur
export function createFeatureRecord(
  features: MatchFeatures,
  aiConfidence: number,
  aiReasoning: string,
  mathConfidence: number,
  poissonData?: { homeExpected: number; awayExpected: number }
) {
  return {
    home_form_score: features.homeTeam.formScore,
    away_form_score: features.awayTeam.formScore,
    home_goal_avg: features.homeTeam.goalAverage,
    away_goal_avg: features.awayTeam.goalAverage,
    position_diff: features.positionDiff,
    home_advantage_score: features.homeAdvantageScore,
    h2h_home_wins: features.h2h.homeWins,
    h2h_away_wins: features.h2h.awayWins,
    h2h_draws: features.h2h.draws,
    expected_goals: features.expectedGoals,
    ai_confidence: aiConfidence,
    ai_reasoning: aiReasoning,
    mathematical_confidence: mathConfidence,
    hybrid_confidence: (aiConfidence * 0.4 + mathConfidence * 0.4 + 0.5 * 0.2),
    poisson_home_expected: poissonData?.homeExpected ?? null,
    poisson_away_expected: poissonData?.awayExpected ?? null,
  };
}
