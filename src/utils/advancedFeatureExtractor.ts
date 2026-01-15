import { Standing } from '@/types/footballApi';
import { HeadToHead } from '@/types/match';
import { calculateMomentum, analyzeTrend, analyzeStreak, calculateCleanSheetRatio, calculateFailedToScoreRatio, calculateMatchImportance, MatchContext } from './contextAnalyzer';
import { calculatePowerIndexes, calculatePoissonExpectedGoals, generateScoreProbabilities, calculateMatchResultProbabilities, calculateGoalLineProbabilities, calculateBTTSProbability, getMostLikelyScores, PowerIndexes, PoissonExpectedGoals, ScoreProbability } from './poissonCalculator';
import { isDerbyMatch, getDerbyName } from './derbyDetector';

// Genişletilmiş takım özellikleri
export interface ExtendedTeamFeatures {
  name: string;
  position: number;
  points: number;
  
  // Form
  formScore: number;
  form: string;
  momentum: number;
  trend: 'rising' | 'stable' | 'falling';
  streak: { type: 'win' | 'draw' | 'loss' | 'none'; count: number };
  
  // Gol istatistikleri
  goalsScored: number;
  goalsConceded: number;
  goalAverage: number;
  
  // Güç endeksleri
  powerIndexes: PowerIndexes;
  
  // Savunma/Hücum oranları
  cleanSheetRatio: number;
  failedToScoreRatio: number;
  
  // Performans
  wins: number;
  draws: number;
  losses: number;
  gamesPlayed: number;
}

// Genişletilmiş H2H özellikleri
export interface ExtendedH2HFeatures {
  homeWins: number;
  awayWins: number;
  draws: number;
  totalMatches: number;
  homeWinRate: number;
  awayWinRate: number;
  drawRate: number;
  avgGoals: number;
}

// Poisson analiz sonuçları
export interface PoissonAnalysis {
  expectedGoals: PoissonExpectedGoals;
  matchResultProbs: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  goalLineProbs: {
    over1_5: number;
    over2_5: number;
    over3_5: number;
  };
  bttsProbability: number;
  mostLikelyScores: ScoreProbability[];
}

// Tam maç analiz sonucu
export interface AdvancedMatchFeatures {
  homeTeam: ExtendedTeamFeatures;
  awayTeam: ExtendedTeamFeatures;
  h2h: ExtendedH2HFeatures;
  context: MatchContext;
  poisson: PoissonAnalysis;
  
  // Özet metrikler
  positionDiff: number;
  homeAdvantageScore: number;
  formDiff: number;
  powerDiff: number;
  
  // Özel durumlar
  isDerby: boolean;
  derbyName: string | null;
  matchBadges: string[];
}

// Genişletilmiş takım özelliklerini çıkar
export function extractExtendedTeamFeatures(
  standing: Standing,
  leagueAvgScored: number = 1.3,
  leagueAvgConceded: number = 1.3
): ExtendedTeamFeatures {
  const games = standing.playedGames || 1;
  const formScore = calculateFormScoreAdvanced(standing.form);
  const powerIndexes = calculatePowerIndexes(
    standing.goalsFor,
    standing.goalsAgainst,
    games,
    leagueAvgScored,
    leagueAvgConceded
  );
  
  return {
    name: standing.team.name,
    position: standing.position,
    points: standing.points,
    
    formScore,
    form: standing.form || '',
    momentum: calculateMomentum(standing.form),
    trend: analyzeTrend(standing.form),
    streak: analyzeStreak(standing.form),
    
    goalsScored: standing.goalsFor,
    goalsConceded: standing.goalsAgainst,
    goalAverage: Math.round((standing.goalsFor / games) * 100) / 100,
    
    powerIndexes,
    
    cleanSheetRatio: calculateCleanSheetRatio(standing.goalsAgainst, games),
    failedToScoreRatio: calculateFailedToScoreRatio(standing.goalsFor, games),
    
    wins: standing.won,
    draws: standing.draw,
    losses: standing.lost,
    gamesPlayed: games,
  };
}

// Gelişmiş form skoru
function calculateFormScoreAdvanced(form: string | null): number {
  if (!form) return 50;
  
  const results = form.split(',').slice(-5);
  let score = 0;
  
  results.forEach((result, index) => {
    const weight = 1 + (index * 0.3); // Daha güçlü ağırlık
    switch (result) {
      case 'W': score += 3 * weight; break;
      case 'D': score += 1 * weight; break;
      case 'L': score += 0; break;
    }
  });
  
  const maxScore = results.length * 3 * 2.2;
  return Math.round((score / maxScore) * 100);
}

// Genişletilmiş H2H özelliklerini çıkar
export function extractExtendedH2HFeatures(h2h: HeadToHead): ExtendedH2HFeatures {
  const total = h2h.homeWins + h2h.awayWins + h2h.draws || 1;
  
  return {
    homeWins: h2h.homeWins,
    awayWins: h2h.awayWins,
    draws: h2h.draws,
    totalMatches: total,
    homeWinRate: Math.round((h2h.homeWins / total) * 100),
    awayWinRate: Math.round((h2h.awayWins / total) * 100),
    drawRate: Math.round((h2h.draws / total) * 100),
    avgGoals: calculateH2HAvgGoals(h2h),
  };
}

function calculateH2HAvgGoals(h2h: HeadToHead): number {
  if (!h2h.lastMatches || h2h.lastMatches.length === 0) return 2.5;
  
  let totalGoals = 0;
  h2h.lastMatches.forEach(match => {
    const [home, away] = match.score.split('-').map(Number);
    totalGoals += (home || 0) + (away || 0);
  });
  
  return Math.round((totalGoals / h2h.lastMatches.length) * 10) / 10;
}

// Poisson analizi yap
export function performPoissonAnalysis(
  homeTeam: ExtendedTeamFeatures,
  awayTeam: ExtendedTeamFeatures,
  leagueAvgHome: number = 1.5,
  leagueAvgAway: number = 1.1
): PoissonAnalysis {
  const expectedGoals = calculatePoissonExpectedGoals(
    homeTeam.powerIndexes.attackStrength,
    homeTeam.powerIndexes.defenseStrength,
    awayTeam.powerIndexes.attackStrength,
    awayTeam.powerIndexes.defenseStrength,
    leagueAvgHome,
    leagueAvgAway
  );
  
  const scoreProbabilities = generateScoreProbabilities(
    expectedGoals.homeExpected,
    expectedGoals.awayExpected
  );
  
  const matchResultProbs = calculateMatchResultProbabilities(scoreProbabilities);
  const goalLineProbs = calculateGoalLineProbabilities(scoreProbabilities);
  const bttsProbability = calculateBTTSProbability(scoreProbabilities);
  const mostLikelyScores = getMostLikelyScores(scoreProbabilities, 5);
  
  return {
    expectedGoals,
    matchResultProbs,
    goalLineProbs: {
      over1_5: goalLineProbs.over1_5,
      over2_5: goalLineProbs.over2_5,
      over3_5: goalLineProbs.over3_5,
    },
    bttsProbability,
    mostLikelyScores,
  };
}

// Maç rozetlerini oluştur
function generateMatchBadges(
  homeTeam: ExtendedTeamFeatures,
  awayTeam: ExtendedTeamFeatures,
  context: MatchContext
): string[] {
  const badges: string[] = [];
  
  // Form rozetleri
  if (homeTeam.formScore >= 80) badges.push('🔥 Ev Sahibi Formda');
  if (awayTeam.formScore >= 80) badges.push('🔥 Deplasman Formda');
  if (homeTeam.formScore <= 30) badges.push('❄️ Ev Sahibi Kötü Formda');
  if (awayTeam.formScore <= 30) badges.push('❄️ Deplasman Kötü Formda');
  
  // Streak rozetleri
  if (homeTeam.streak.type === 'win' && homeTeam.streak.count >= 3) {
    badges.push(`🏆 Ev Sahibi ${homeTeam.streak.count} Galibiyet Serisi`);
  }
  if (awayTeam.streak.type === 'win' && awayTeam.streak.count >= 3) {
    badges.push(`🏆 Deplasman ${awayTeam.streak.count} Galibiyet Serisi`);
  }
  
  // Momentum rozetleri
  if (homeTeam.momentum >= 60) badges.push('📈 Ev Sahibi Yükselişte');
  if (awayTeam.momentum >= 60) badges.push('📈 Deplasman Yükselişte');
  if (homeTeam.momentum <= -30) badges.push('📉 Ev Sahibi Düşüşte');
  if (awayTeam.momentum <= -30) badges.push('📉 Deplasman Düşüşte');
  
  // Güç rozetleri
  if (homeTeam.powerIndexes.attackStrength >= 1.5) badges.push('⚡ Ev Sahibi Gol Makinesi');
  if (awayTeam.powerIndexes.attackStrength >= 1.5) badges.push('⚡ Deplasman Gol Makinesi');
  if (homeTeam.powerIndexes.defenseStrength <= 0.7) badges.push('🛡️ Ev Sahibi Savunma Ustası');
  if (awayTeam.powerIndexes.defenseStrength <= 0.7) badges.push('🛡️ Deplasman Savunma Ustası');
  
  // Bağlam rozetleri
  badges.push(...context.contextTags);
  
  return badges.slice(0, 6); // Max 6 rozet
}

// Ev sahibi avantaj skoru (gelişmiş)
function calculateAdvancedHomeAdvantage(
  homeTeam: ExtendedTeamFeatures,
  awayTeam: ExtendedTeamFeatures,
  context: MatchContext
): number {
  let advantage = 0;
  
  // Temel puan farkı
  advantage += (homeTeam.points - awayTeam.points) * 0.5;
  
  // Ev sahibi bonusu
  advantage += 8;
  
  // Form farkı etkisi
  advantage += (homeTeam.formScore - awayTeam.formScore) * 0.15;
  
  // Momentum farkı
  advantage += (homeTeam.momentum - awayTeam.momentum) * 0.1;
  
  // Derbi maçlarında avantaj düşer
  if (context.isDerby) {
    advantage *= 0.7;
  }
  
  // Kritik maçlarda avantaj düşer
  if (context.matchImportance === 'critical') {
    advantage *= 0.8;
  }
  
  return Math.max(-40, Math.min(40, Math.round(advantage)));
}

// Ana fonksiyon: Tüm gelişmiş özellikleri çıkar
export function extractAdvancedMatchFeatures(
  homeStanding: Standing,
  awayStanding: Standing,
  h2h: HeadToHead,
  league: string,
  leagueAvgScored: number = 1.3,
  leagueAvgConceded: number = 1.3,
  leagueAvgHome: number = 1.5,
  leagueAvgAway: number = 1.1
): AdvancedMatchFeatures {
  // Takım özelliklerini çıkar
  const homeTeam = extractExtendedTeamFeatures(homeStanding, leagueAvgScored, leagueAvgConceded);
  const awayTeam = extractExtendedTeamFeatures(awayStanding, leagueAvgScored, leagueAvgConceded);
  
  // H2H özelliklerini çıkar
  const h2hFeatures = extractExtendedH2HFeatures(h2h);
  
  // Bağlam analizi
  const context = calculateMatchImportance(homeStanding, awayStanding, league, homeStanding.playedGames);
  
  // Poisson analizi
  const poisson = performPoissonAnalysis(homeTeam, awayTeam, leagueAvgHome, leagueAvgAway);
  
  // Derbi kontrolü
  const derby = isDerbyMatch(homeStanding.team.name, awayStanding.team.name, league);
  const derbyName = derby ? getDerbyName(homeStanding.team.name, awayStanding.team.name, league) : null;
  
  // Rozetler
  const matchBadges = generateMatchBadges(homeTeam, awayTeam, context);
  
  return {
    homeTeam,
    awayTeam,
    h2h: h2hFeatures,
    context,
    poisson,
    
    positionDiff: homeStanding.position - awayStanding.position,
    homeAdvantageScore: calculateAdvancedHomeAdvantage(homeTeam, awayTeam, context),
    formDiff: homeTeam.formScore - awayTeam.formScore,
    powerDiff: homeTeam.powerIndexes.overallPower - awayTeam.powerIndexes.overallPower,
    
    isDerby: derby,
    derbyName,
    matchBadges,
  };
}

// Veritabanı için feature objesi oluştur
export function createAdvancedFeatureRecord(
  features: AdvancedMatchFeatures,
  aiConfidence: number,
  aiReasoning: string,
  mathConfidence: number
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
    expected_goals: features.poisson.expectedGoals.totalExpected,
    ai_confidence: aiConfidence,
    ai_reasoning: aiReasoning,
    mathematical_confidence: mathConfidence,
    hybrid_confidence: (aiConfidence * 0.4 + mathConfidence * 0.4 + 0.5 * 0.2),
    
    // Yeni alanlar
    home_attack_index: features.homeTeam.powerIndexes.attackStrength,
    home_defense_index: features.homeTeam.powerIndexes.defenseStrength,
    away_attack_index: features.awayTeam.powerIndexes.attackStrength,
    away_defense_index: features.awayTeam.powerIndexes.defenseStrength,
    match_importance: features.context.matchImportance,
    is_derby: features.isDerby,
    home_momentum: features.homeTeam.momentum,
    away_momentum: features.awayTeam.momentum,
    poisson_home_expected: features.poisson.expectedGoals.homeExpected,
    poisson_away_expected: features.poisson.expectedGoals.awayExpected,
  };
}
