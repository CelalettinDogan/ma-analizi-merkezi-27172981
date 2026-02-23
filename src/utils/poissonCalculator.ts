// Poisson Dağılımı ile Profesyonel Gol Tahmini

// Faktöriyel hesapla
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Poisson olasılık formülü: P(X=k) = (λ^k * e^-λ) / k!
export function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Beklenen gol hesapla (Poisson modeli)
export interface PoissonExpectedGoals {
  homeExpected: number;
  awayExpected: number;
  totalExpected: number;
}

export function calculatePoissonExpectedGoals(
  homeAttackStrength: number,
  homeDefenseStrength: number,
  awayAttackStrength: number,
  awayDefenseStrength: number,
  leagueAvgHomeGoals: number = 1.5,
  leagueAvgAwayGoals: number = 1.1
): PoissonExpectedGoals {
  // λ_home = HomeAttack × AwayDefense × LeagueAvgHome
  // λ_away = AwayAttack × HomeDefense × LeagueAvgAway
  
  const homeExpected = homeAttackStrength * awayDefenseStrength * leagueAvgHomeGoals;
  const awayExpected = awayAttackStrength * homeDefenseStrength * leagueAvgAwayGoals;
  
  return {
    homeExpected: Math.round(homeExpected * 100) / 100,
    awayExpected: Math.round(awayExpected * 100) / 100,
    totalExpected: Math.round((homeExpected + awayExpected) * 100) / 100,
  };
}

// Güç endeksi hesapla
export interface PowerIndexes {
  attackStrength: number;  // > 1 = lig ortalamasından iyi
  defenseStrength: number; // < 1 = lig ortalamasından iyi
  overallPower: number;
}

export function calculatePowerIndexes(
  goalsScored: number,
  goalsConceded: number,
  gamesPlayed: number,
  leagueAvgScored: number = 1.3,
  leagueAvgConceded: number = 1.3
): PowerIndexes {
  const avgScored = goalsScored / Math.max(gamesPlayed, 1);
  const avgConceded = goalsConceded / Math.max(gamesPlayed, 1);
  
  const attackStrength = avgScored / leagueAvgScored;
  const defenseStrength = avgConceded / leagueAvgConceded;
  
  // Overall = (Attack / Defense) - savunma düşük olmalı
  const overallPower = attackStrength / Math.max(defenseStrength, 0.1);
  
  return {
    attackStrength: Math.round(attackStrength * 100) / 100,
    defenseStrength: Math.round(defenseStrength * 100) / 100,
    overallPower: Math.round(overallPower * 100) / 100,
  };
}

// Skor olasılıkları matrisi oluştur
export interface ScoreProbability {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

// Dixon-Coles düzeltme faktörü: düşük skorlu sonuçlarda (0-0, 1-0, 0-1, 1-1) daha doğru olasılık
function dixonColesAdjustment(
  homeGoals: number,
  awayGoals: number,
  lambda: number, // home expected
  mu: number,     // away expected
  rho: number = -0.1
): number {
  if (homeGoals === 0 && awayGoals === 0) {
    return 1 + rho * lambda * mu;
  } else if (homeGoals === 1 && awayGoals === 0) {
    return 1 - rho * mu;
  } else if (homeGoals === 0 && awayGoals === 1) {
    return 1 - rho * lambda;
  } else if (homeGoals === 1 && awayGoals === 1) {
    return 1 + rho;
  }
  return 1.0; // Diğer skorlar için düzeltme yok
}

export function generateScoreProbabilities(
  homeExpected: number,
  awayExpected: number,
  maxGoals: number = 6,
  rho: number = -0.1
): ScoreProbability[] {
  const probabilities: ScoreProbability[] = [];
  
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      let prob = poissonProbability(homeExpected, h) * poissonProbability(awayExpected, a);
      // Dixon-Coles düzeltmesi uygula (düşük skorlu sonuçlar için)
      const adjustment = dixonColesAdjustment(h, a, homeExpected, awayExpected, rho);
      prob *= Math.max(0, adjustment); // Negatif olasılık önle
      probabilities.push({
        homeGoals: h,
        awayGoals: a,
        probability: Math.round(prob * 10000) / 100, // Yüzde olarak
      });
    }
  }
  
  return probabilities.sort((a, b) => b.probability - a.probability);
}

// Maç sonucu olasılıkları
export interface MatchResultProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export function calculateMatchResultProbabilities(scoreProbabilities: ScoreProbability[]): MatchResultProbabilities {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  
  scoreProbabilities.forEach(sp => {
    if (sp.homeGoals > sp.awayGoals) {
      homeWin += sp.probability;
    } else if (sp.homeGoals === sp.awayGoals) {
      draw += sp.probability;
    } else {
      awayWin += sp.probability;
    }
  });
  
  return {
    homeWin: Math.round(homeWin * 100) / 100,
    draw: Math.round(draw * 100) / 100,
    awayWin: Math.round(awayWin * 100) / 100,
  };
}

// Over/Under olasılıkları
export interface GoalLineProbabilities {
  over0_5: number;
  under0_5: number;
  over1_5: number;
  under1_5: number;
  over2_5: number;
  under2_5: number;
  over3_5: number;
  under3_5: number;
  over4_5: number;
  under4_5: number;
}

export function calculateGoalLineProbabilities(scoreProbabilities: ScoreProbability[]): GoalLineProbabilities {
  const lines = { 0.5: 0, 1.5: 0, 2.5: 0, 3.5: 0, 4.5: 0 };
  
  scoreProbabilities.forEach(sp => {
    const total = sp.homeGoals + sp.awayGoals;
    Object.keys(lines).forEach(lineStr => {
      const line = parseFloat(lineStr);
      if (total > line) {
        lines[line as keyof typeof lines] += sp.probability;
      }
    });
  });
  
  return {
    over0_5: Math.round(lines[0.5] * 100) / 100,
    under0_5: Math.round((100 - lines[0.5]) * 100) / 100,
    over1_5: Math.round(lines[1.5] * 100) / 100,
    under1_5: Math.round((100 - lines[1.5]) * 100) / 100,
    over2_5: Math.round(lines[2.5] * 100) / 100,
    under2_5: Math.round((100 - lines[2.5]) * 100) / 100,
    over3_5: Math.round(lines[3.5] * 100) / 100,
    under3_5: Math.round((100 - lines[3.5]) * 100) / 100,
    over4_5: Math.round(lines[4.5] * 100) / 100,
    under4_5: Math.round((100 - lines[4.5]) * 100) / 100,
  };
}

// Both Teams To Score olasılığı
export function calculateBTTSProbability(scoreProbabilities: ScoreProbability[]): number {
  let btts = 0;
  
  scoreProbabilities.forEach(sp => {
    if (sp.homeGoals > 0 && sp.awayGoals > 0) {
      btts += sp.probability;
    }
  });
  
  return Math.round(btts * 100) / 100;
}

// En olası skorlar
export function getMostLikelyScores(scoreProbabilities: ScoreProbability[], count: number = 5): ScoreProbability[] {
  return scoreProbabilities.slice(0, count);
}
