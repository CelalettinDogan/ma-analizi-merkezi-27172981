import { Standing } from '@/types/footballApi';
import { isDerbyMatch, isTopSixClash } from './derbyDetector';

export interface MatchContext {
  matchImportance: 'critical' | 'high' | 'normal' | 'low';
  isDerby: boolean;
  isTopSixClash: boolean;
  isRelegationBattle: boolean;
  isTitleRace: boolean;
  isEuropeRace: boolean;
  seasonPhase: 'early' | 'mid' | 'late' | 'final';
  homeRestDays: number;
  awayRestDays: number;
  contextTags: string[];
}

// Sezon fazını hesapla
export function calculateSeasonPhase(playedGames: number, totalGames: number = 38): 'early' | 'mid' | 'late' | 'final' {
  const progress = playedGames / totalGames;
  if (progress < 0.25) return 'early';
  if (progress < 0.55) return 'mid';
  if (progress < 0.85) return 'late';
  return 'final';
}

// Maç önemi hesapla
export function calculateMatchImportance(
  homeStanding: Standing,
  awayStanding: Standing,
  league: string,
  playedGames: number = 20
): MatchContext {
  const leagueSize = 20; // Varsayılan lig boyutu
  const remainingMatches = leagueSize * 2 - 2 - playedGames;
  const seasonPhase = calculateSeasonPhase(playedGames);
  
  // Pozisyon analizi
  const homePos = homeStanding.position;
  const awayPos = awayStanding.position;
  
  const titleRace = homePos <= 2 || awayPos <= 2;
  const europeRace = (homePos >= 3 && homePos <= 7) || (awayPos >= 3 && awayPos <= 7);
  const relegationBattle = homePos >= leagueSize - 3 || awayPos >= leagueSize - 3;
  const directRival = Math.abs(homePos - awayPos) <= 3;
  
  // Derbi ve büyük maç kontrolü
  const derby = isDerbyMatch(homeStanding.team.name, awayStanding.team.name, league);
  const topClash = isTopSixClash(homeStanding.team.name, awayStanding.team.name, league);
  
  // Önem skoru hesapla
  let importance: 'critical' | 'high' | 'normal' | 'low' = 'normal';
  
  if (
    (titleRace && directRival && seasonPhase === 'final') ||
    (relegationBattle && directRival && seasonPhase === 'final') ||
    derby
  ) {
    importance = 'critical';
  } else if (
    (titleRace && seasonPhase !== 'early') ||
    (relegationBattle && seasonPhase !== 'early') ||
    (europeRace && directRival) ||
    topClash
  ) {
    importance = 'high';
  } else if (seasonPhase === 'early' && !derby) {
    importance = 'low';
  }
  
  // Bağlam etiketleri oluştur
  const contextTags: string[] = [];
  
  if (derby) contextTags.push('⚔️ Derbi');
  if (topClash) contextTags.push('🏆 Zirve Mücadelesi');
  if (titleRace) contextTags.push('👑 Şampiyonluk Yarışı');
  if (europeRace) contextTags.push('🌟 Avrupa Mücadelesi');
  if (relegationBattle) contextTags.push('⚠️ Düşme Hattı');
  if (directRival) contextTags.push('🎯 Doğrudan Rakip');
  if (seasonPhase === 'final') contextTags.push('🔥 Sezon Finali');
  
  return {
    matchImportance: importance,
    isDerby: derby,
    isTopSixClash: topClash,
    isRelegationBattle: relegationBattle,
    isTitleRace: titleRace,
    isEuropeRace: europeRace,
    seasonPhase,
    homeRestDays: 7, // API'de bu veri yok, varsayılan
    awayRestDays: 7,
    contextTags,
  };
}

// Momentum skoru hesapla (son maçlardaki trend)
export function calculateMomentum(form: string | null): number {
  if (!form) return 0;
  
  const results = form.split(',').slice(-5);
  let momentum = 0;
  
  // Son maçlara ağırlıklı puan ver
  results.forEach((result, index) => {
    const weight = (index + 1) * 2; // 2, 4, 6, 8, 10
    switch (result) {
      case 'W': momentum += weight; break;
      case 'D': momentum += weight * 0.3; break;
      case 'L': momentum -= weight * 0.5; break;
    }
  });
  
  // -100 ile +100 arası normalize et
  const maxMomentum = 30; // 5 galibiyet = 2+4+6+8+10 = 30
  return Math.round((momentum / maxMomentum) * 100);
}

// Trend analizi
export function analyzeTrend(form: string | null): 'rising' | 'stable' | 'falling' {
  if (!form) return 'stable';
  
  const results = form.split(',').slice(-5);
  if (results.length < 3) return 'stable';
  
  const firstHalf = results.slice(0, Math.ceil(results.length / 2));
  const secondHalf = results.slice(Math.ceil(results.length / 2));
  
  const scoreFirst = firstHalf.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / firstHalf.length;
  const scoreSecond = secondHalf.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / secondHalf.length;
  
  const diff = scoreSecond - scoreFirst;
  
  if (diff > 0.5) return 'rising';
  if (diff < -0.5) return 'falling';
  return 'stable';
}

// Streak analizi (galibiyet/mağlubiyet serisi)
export function analyzeStreak(form: string | null): { type: 'win' | 'draw' | 'loss' | 'none'; count: number } {
  if (!form) return { type: 'none', count: 0 };
  
  const results = form.split(',').reverse(); // En son maçtan başla
  if (results.length === 0) return { type: 'none', count: 0 };
  
  const firstResult = results[0];
  let count = 0;
  
  for (const result of results) {
    if (result === firstResult) {
      count++;
    } else {
      break;
    }
  }
  
  const typeMap: Record<string, 'win' | 'draw' | 'loss'> = {
    'W': 'win',
    'D': 'draw',
    'L': 'loss',
  };
  
  return {
    type: typeMap[firstResult] || 'none',
    count,
  };
}

// Clean sheet oranı
export function calculateCleanSheetRatio(goalsConceded: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  // Tahmini clean sheet: ortalama gol yeme 0.5 altında ise yüksek
  const avgConceded = goalsConceded / gamesPlayed;
  if (avgConceded < 0.5) return 70;
  if (avgConceded < 0.8) return 50;
  if (avgConceded < 1.0) return 35;
  if (avgConceded < 1.3) return 20;
  return 10;
}

// Gol atamama oranı
export function calculateFailedToScoreRatio(goalsScored: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 50;
  const avgScored = goalsScored / gamesPlayed;
  if (avgScored > 2.0) return 5;
  if (avgScored > 1.5) return 15;
  if (avgScored > 1.0) return 25;
  if (avgScored > 0.7) return 40;
  return 60;
}
