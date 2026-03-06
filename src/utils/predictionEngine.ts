import { Standing, Match } from '@/types/footballApi';
import { MatchAnalysis, Prediction, TeamStats, HeadToHead } from '@/types/match';

interface TeamData {
  standing: Standing;
  recentMatches: Match[];
}

interface AnalysisInput {
  homeTeam: TeamData;
  awayTeam: TeamData;
  h2hMatches: Match[];
  league: string;
  matchDate: string;
  poissonOver25Prob?: number; // 0-1 range
  leagueOver25Pct?: number; // 0-100 range
  poissonHomeWinProb?: number; // 0-100
  poissonDrawProb?: number; // 0-100
  poissonAwayWinProb?: number; // 0-100
  poissonBttsProb?: number; // 0-100
  poissonMostLikelyScore?: { home: number; away: number };
  poissonFirstHalfHome?: number; // ilk yarı beklenen ev golü
  poissonFirstHalfAway?: number; // ilk yarı beklenen deplasman golü
}

// Form string'ini puan olarak hesapla (son 5 maç)
function calculateFormScore(form: string | null): number {
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
  const maxScore = results.length * 3 * 1.8; // Max possible with weights
  return Math.round((score / maxScore) * 100);
}

// Gol ortalaması hesapla
function calculateGoalAverage(standing: Standing): { scored: number; conceded: number } {
  const games = standing.playedGames || 1;
  return {
    scored: Math.round((standing.goalsFor / games) * 100) / 100,
    conceded: Math.round((standing.goalsAgainst / games) * 100) / 100,
  };
}

// Ev sahibi/Deplasman avantajı hesapla
function calculateHomeAdvantage(homeStanding: Standing, awayStanding: Standing): number {
  const homePoints = homeStanding.points;
  const awayPoints = awayStanding.points;
  const pointDiff = homePoints - awayPoints;
  const homeBonus = 10;
  const advantage = Math.max(-30, Math.min(30, pointDiff + homeBonus));
  return advantage;
}

// Head-to-head analizi
function analyzeH2H(matches: Match[], homeTeamId: number, awayTeamId: number): HeadToHead {
  const h2h: HeadToHead = {
    lastMatches: [],
    homeWins: 0,
    awayWins: 0,
    draws: 0,
  };

  matches.slice(0, 10).forEach(match => {
    const homeScore = match.score.fullTime.home ?? 0;
    const awayScore = match.score.fullTime.away ?? 0;
    
    h2h.lastMatches.push({
      date: match.utcDate.split('T')[0],
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      score: `${homeScore}-${awayScore}`,
    });

    const isCurrentHomeTeamHome = match.homeTeam.id === homeTeamId;
    
    if (homeScore > awayScore) {
      if (isCurrentHomeTeamHome) h2h.homeWins++;
      else h2h.awayWins++;
    } else if (awayScore > homeScore) {
      if (isCurrentHomeTeamHome) h2h.awayWins++;
      else h2h.homeWins++;
    } else {
      h2h.draws++;
    }
  });

  return h2h;
}

// Ana tahmin motoru
export function generatePrediction(input: AnalysisInput): MatchAnalysis {
  const { homeTeam, awayTeam, h2hMatches, league, matchDate } = input;
  
  const homeFormScore = calculateFormScore(homeTeam.standing.form);
  const awayFormScore = calculateFormScore(awayTeam.standing.form);
  
  const homeGoalAvg = calculateGoalAverage(homeTeam.standing);
  const awayGoalAvg = calculateGoalAverage(awayTeam.standing);
  
  const homeAdvantage = calculateHomeAdvantage(homeTeam.standing, awayTeam.standing);
  
  const h2h = analyzeH2H(h2hMatches, homeTeam.standing.team.id, awayTeam.standing.team.id);
  
  const homeForm = homeTeam.standing.form?.split(',').slice(-5) || [];
  const awayForm = awayTeam.standing.form?.split(',').slice(-5) || [];

  const homeTeamStats: TeamStats = {
    form: homeForm,
    goalsScored: homeGoalAvg.scored,
    goalsConceded: homeGoalAvg.conceded,
    homePerformance: {
      wins: homeTeam.standing.won,
      draws: homeTeam.standing.draw,
      losses: homeTeam.standing.lost,
    },
  };

  const awayTeamStats: TeamStats = {
    form: awayForm,
    goalsScored: awayGoalAvg.scored,
    goalsConceded: awayGoalAvg.conceded,
    awayPerformance: {
      wins: awayTeam.standing.won,
      draws: awayTeam.standing.draw,
      losses: awayTeam.standing.lost,
    },
  };

  const predictions = generatePredictions({
    homeFormScore,
    awayFormScore,
    homeGoalAvg,
    awayGoalAvg,
    homeAdvantage,
    h2h,
    homeTeamName: homeTeam.standing.team.name,
    awayTeamName: awayTeam.standing.team.name,
    homePosition: homeTeam.standing.position,
    awayPosition: awayTeam.standing.position,
    poissonOver25Prob: input.poissonOver25Prob,
    leagueOver25Pct: input.leagueOver25Pct,
    poissonHomeWinProb: input.poissonHomeWinProb,
    poissonDrawProb: input.poissonDrawProb,
    poissonAwayWinProb: input.poissonAwayWinProb,
    poissonBttsProb: input.poissonBttsProb,
    poissonMostLikelyScore: input.poissonMostLikelyScore,
    poissonFirstHalfHome: input.poissonFirstHalfHome,
    poissonFirstHalfAway: input.poissonFirstHalfAway,
  });

  const tacticalAnalysis = generateTacticalAnalysis(
    homeTeam.standing,
    awayTeam.standing,
    homeFormScore,
    awayFormScore
  );

  const keyFactors = generateKeyFactors(
    homeTeam.standing,
    awayTeam.standing,
    homeFormScore,
    awayFormScore,
    h2h
  );

  return {
    input: {
      league,
      homeTeam: homeTeam.standing.team.name,
      awayTeam: awayTeam.standing.team.name,
      matchDate,
    },
    homeTeamStats,
    awayTeamStats,
    headToHead: h2h,
    predictions,
    tacticalAnalysis,
    keyFactors,
    injuries: { home: [], away: [] },
  };
}

interface PredictionInput {
  homeFormScore: number;
  awayFormScore: number;
  homeGoalAvg: { scored: number; conceded: number };
  awayGoalAvg: { scored: number; conceded: number };
  homeAdvantage: number;
  h2h: HeadToHead;
  homeTeamName: string;
  awayTeamName: string;
  homePosition: number;
  awayPosition: number;
  poissonOver25Prob?: number;
  leagueOver25Pct?: number;
  poissonHomeWinProb?: number;
  poissonDrawProb?: number;
  poissonAwayWinProb?: number;
  poissonBttsProb?: number;
  poissonMostLikelyScore?: { home: number; away: number };
  poissonFirstHalfHome?: number;
  poissonFirstHalfAway?: number;
}

// Simple Poisson probability helper for inline calculations
function inlinePoissonProb(lambda: number, k: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

function generatePredictions(input: PredictionInput): Prediction[] {
  const {
    homeFormScore,
    awayFormScore,
    homeGoalAvg,
    awayGoalAvg,
    homeAdvantage,
    h2h,
    homeTeamName,
    awayTeamName,
    homePosition,
    awayPosition,
  } = input;

  const predictions: Prediction[] = [];

  // 1. Maç Sonucu Tahmini - Poisson tabanlı
  const totalScore = homeFormScore + homeAdvantage;
  const scoreDiff = totalScore - awayFormScore;
  
  let matchResult: string;
  let matchConfidence: 'düşük' | 'orta' | 'yüksek';
  let matchReasoning: string;
  let matchProbability: number | undefined;

  const pHomeWin = input.poissonHomeWinProb;
  const pDraw = input.poissonDrawProb;
  const pAwayWin = input.poissonAwayWinProb;

  if (pHomeWin !== undefined && pDraw !== undefined && pAwayWin !== undefined) {
    const maxProb = Math.max(pHomeWin, pDraw, pAwayWin);
    matchProbability = maxProb; // Real Poisson probability
    
    if (pHomeWin > 58 && pHomeWin === maxProb) {
      matchResult = `${homeTeamName} Kazanır`;
      matchConfidence = 'yüksek';
      matchReasoning = `Poisson modeli %${pHomeWin.toFixed(0)} olasılıkla ev sahibi galibiyeti gösteriyor. ${homeTeamName} ${homePosition}. sırada.`;
    } else if (pHomeWin > 45 && pHomeWin === maxProb) {
      matchResult = `${homeTeamName} Kazanır`;
      matchConfidence = 'orta';
      matchReasoning = `Poisson modeli %${pHomeWin.toFixed(0)} olasılıkla ${homeTeamName} hafif favori. Ev sahibi avantajı etkili.`;
    } else if (pAwayWin > 58 && pAwayWin === maxProb) {
      matchResult = `${awayTeamName} Kazanır`;
      matchConfidence = 'yüksek';
      matchReasoning = `Poisson modeli %${pAwayWin.toFixed(0)} olasılıkla deplasman galibiyeti gösteriyor. ${awayTeamName} ${awayPosition}. sırada.`;
    } else if (pAwayWin > 45 && pAwayWin === maxProb) {
      matchResult = `${awayTeamName} Kazanır`;
      matchConfidence = 'orta';
      matchReasoning = `Poisson modeli %${pAwayWin.toFixed(0)} olasılıkla ${awayTeamName} hafif favori.`;
    } else if (pDraw > 28 && pDraw === maxProb) {
      matchResult = 'Beraberlik';
      matchConfidence = 'orta';
      matchReasoning = `Poisson modeli %${pDraw.toFixed(0)} beraberlik olasılığı hesapladı. Dengeli güçler.`;
    } else {
      if (maxProb === pHomeWin) {
        matchResult = `${homeTeamName} Kazanır`;
      } else if (maxProb === pAwayWin) {
        matchResult = `${awayTeamName} Kazanır`;
      } else {
        matchResult = 'Beraberlik';
      }
      matchConfidence = 'düşük';
      matchReasoning = `Olasılıklar çok yakın (Ev: %${pHomeWin.toFixed(0)}, Ber: %${pDraw.toFixed(0)}, Dep: %${pAwayWin.toFixed(0)}). Belirsiz maç.`;
    }
  } else {
    if (scoreDiff > 25) {
      matchResult = `${homeTeamName} Kazanır`;
      matchConfidence = 'yüksek';
      matchReasoning = `${homeTeamName} üstün form ve ev sahibi avantajıyla açık favori.`;
    } else if (scoreDiff > 10) {
      matchResult = `${homeTeamName} Kazanır`;
      matchConfidence = 'orta';
      matchReasoning = `${homeTeamName} hafif favori. Ev sahibi avantajı ve form durumu lehine.`;
    } else if (scoreDiff > -10) {
      matchResult = 'Beraberlik';
      matchConfidence = 'orta';
      matchReasoning = `İki takım da benzer form durumunda. Beraberlik güçlü bir olasılık.`;
    } else if (scoreDiff > -25) {
      matchResult = `${awayTeamName} Kazanır`;
      matchConfidence = 'orta';
      matchReasoning = `${awayTeamName} deplasmanda hafif favori.`;
    } else {
      matchResult = `${awayTeamName} Kazanır`;
      matchConfidence = 'yüksek';
      matchReasoning = `${awayTeamName} net favori.`;
    }
  }

  predictions.push({
    type: 'Maç Sonucu',
    prediction: matchResult,
    confidence: matchConfidence,
    reasoning: matchReasoning,
    probability: matchProbability,
  });

  // 2. Toplam Gol Tahmini (Alt/Üst 2.5) - Poisson tabanlı
  const expectedGoals = (homeGoalAvg.scored + awayGoalAvg.scored + homeGoalAvg.conceded + awayGoalAvg.conceded) / 2;
  const over25Prob = input.poissonOver25Prob; // 0-1 range
  
  let goalPrediction: string;
  let goalConfidence: 'düşük' | 'orta' | 'yüksek';
  let goalReasoning: string;
  let goalProbability: number | undefined;

  if (over25Prob !== undefined) {
    const probPct = (over25Prob * 100).toFixed(0);
    const leagueInfo = input.leagueOver25Pct ? ` Lig ortalaması: %${input.leagueOver25Pct.toFixed(0)}.` : '';
    
    // Real probability: whichever side (over or under) the prediction picks
    if (over25Prob > 0.58) {
      goalPrediction = '2.5 Üst';
      goalConfidence = 'yüksek';
      goalProbability = over25Prob * 100;
      goalReasoning = `Poisson modeli %${probPct} olasılıkla 2.5 üstü gösteriyor.${leagueInfo} Beklenen toplam: ${expectedGoals.toFixed(1)} gol.`;
    } else if (over25Prob > 0.52) {
      goalPrediction = '2.5 Üst';
      goalConfidence = 'orta';
      goalProbability = over25Prob * 100;
      goalReasoning = `Poisson modeli %${probPct} olasılıkla hafif üst yönde.${leagueInfo} ${homeTeamName} ${homeGoalAvg.scored.toFixed(2)}, ${awayTeamName} ${awayGoalAvg.scored.toFixed(2)} gol ortalamasına sahip.`;
    } else if (over25Prob < 0.42) {
      goalPrediction = '2.5 Alt';
      goalConfidence = 'yüksek';
      goalProbability = (1 - over25Prob) * 100;
      goalReasoning = `Poisson modeli %${(100 - over25Prob * 100).toFixed(0)} olasılıkla alt gösteriyor.${leagueInfo} Düşük gol beklentisi: ${expectedGoals.toFixed(1)}.`;
    } else if (over25Prob < 0.48) {
      goalPrediction = '2.5 Alt';
      goalConfidence = 'orta';
      goalProbability = (1 - over25Prob) * 100;
      goalReasoning = `Poisson modeli %${(100 - over25Prob * 100).toFixed(0)} olasılıkla alt yönünde.${leagueInfo} Savunma ağırlıklı maç bekleniyor.`;
    } else {
      goalPrediction = over25Prob >= 0.50 ? '2.5 Üst' : '2.5 Alt';
      goalConfidence = 'düşük';
      goalProbability = over25Prob >= 0.50 ? over25Prob * 100 : (1 - over25Prob) * 100;
      goalReasoning = `⚠️ Sınır bölge: Poisson modeli %${probPct} olasılık hesapladı.${leagueInfo} Belirsiz durum, düşük güven.`;
    }
  } else {
    if (expectedGoals > 3.0) {
      goalPrediction = '2.5 Üst';
      goalConfidence = 'yüksek';
      goalReasoning = `Her iki takımın da gol ortalaması yüksek (Ev: ${homeGoalAvg.scored.toFixed(2)}, Dep: ${awayGoalAvg.scored.toFixed(2)}). Beklenen toplam gol: ${expectedGoals.toFixed(1)}.`;
    } else if (expectedGoals > 2.5) {
      goalPrediction = '2.5 Üst';
      goalConfidence = 'orta';
      goalReasoning = `Gol ortalamaları 2.5 üstü gösteriyor. ${homeTeamName} maç başı ${homeGoalAvg.scored.toFixed(2)}, ${awayTeamName} ${awayGoalAvg.scored.toFixed(2)} gol atıyor.`;
    } else if (expectedGoals > 2.0) {
      goalPrediction = '2.5 Alt';
      goalConfidence = 'düşük';
      goalReasoning = `Gol ortalamaları sınırda. Her iki takımın savunma performansı sonucu belirleyecek.`;
    } else {
      goalPrediction = '2.5 Alt';
      goalConfidence = 'orta';
      goalReasoning = `Düşük gol beklentisi. Her iki takım da defansif oynuyor, maç başı ortalama ${expectedGoals.toFixed(1)} gol.`;
    }
  }

  predictions.push({
    type: 'Toplam Gol Alt/Üst',
    prediction: goalPrediction,
    confidence: goalConfidence,
    reasoning: goalReasoning,
    probability: goalProbability,
  });

  // 3. Karşılıklı Gol - Poisson tabanlı
  const pBtts = input.poissonBttsProb; // 0-100
  
  let bttsResult: string;
  let bttsConfidence: 'düşük' | 'orta' | 'yüksek';
  let bttsReasoning: string;
  let bttsProbability: number | undefined;

  if (pBtts !== undefined) {
    if (pBtts > 60) {
      bttsResult = 'Evet';
      bttsConfidence = 'yüksek';
      bttsProbability = pBtts;
      bttsReasoning = `Poisson modeli %${pBtts.toFixed(0)} karşılıklı gol olasılığı hesapladı. Her iki takım da gol atma kapasitesine sahip.`;
    } else if (pBtts > 52) {
      bttsResult = 'Evet';
      bttsConfidence = 'orta';
      bttsProbability = pBtts;
      bttsReasoning = `Poisson modeli %${pBtts.toFixed(0)} karşılıklı gol olasılığı gösteriyor. ${homeTeamName} ${homeGoalAvg.conceded.toFixed(2)} gol yiyor.`;
    } else if (pBtts < 40) {
      bttsResult = 'Hayır';
      bttsConfidence = 'yüksek';
      bttsProbability = 100 - pBtts;
      bttsReasoning = `Poisson modeli %${(100 - pBtts).toFixed(0)} olasılıkla bir takımın gol atamayacağını gösteriyor.`;
    } else if (pBtts < 48) {
      bttsResult = 'Hayır';
      bttsConfidence = 'orta';
      bttsProbability = 100 - pBtts;
      bttsReasoning = `Poisson modeli %${(100 - pBtts).toFixed(0)} olasılıkla karşılıklı gol beklemiyor. Savunma ağırlıklı maç.`;
    } else {
      bttsResult = pBtts >= 50 ? 'Evet' : 'Hayır';
      bttsConfidence = 'düşük';
      bttsProbability = pBtts >= 50 ? pBtts : 100 - pBtts;
      bttsReasoning = `⚠️ Sınır bölge: Poisson BTTS olasılığı %${pBtts.toFixed(0)}. Belirsiz durum.`;
    }
  } else {
    const bothTeamsScoreProb = (homeGoalAvg.scored > 1.2 && awayGoalAvg.scored > 1.0) || 
                                (homeGoalAvg.conceded > 1.0 && awayGoalAvg.conceded > 1.0);
    bttsResult = bothTeamsScoreProb ? 'Evet' : 'Hayır';
    if (homeGoalAvg.scored > 1.5 && awayGoalAvg.scored > 1.3) {
      bttsConfidence = 'yüksek';
    } else if (bothTeamsScoreProb) {
      bttsConfidence = 'orta';
    } else {
      bttsConfidence = 'düşük';
    }
    bttsReasoning = bothTeamsScoreProb
      ? `Her iki takım da gol atma kapasitesine sahip. ${homeTeamName} ${homeGoalAvg.conceded.toFixed(2)}, ${awayTeamName} ${awayGoalAvg.conceded.toFixed(2)} gol yiyor.`
      : `Takımlardan birinin savunması çok güçlü. Karşılıklı gol olasılığı düşük.`;
  }

  predictions.push({
    type: 'Karşılıklı Gol',
    prediction: bttsResult,
    confidence: bttsConfidence,
    reasoning: bttsReasoning,
    probability: bttsProbability,
  });

  // 4. Doğru Skor Tahmini - Poisson en olası skor
  let correctScoreHome: number;
  let correctScoreAway: number;
  let correctScoreProbability: number | undefined;
  
  if (input.poissonMostLikelyScore) {
    correctScoreHome = input.poissonMostLikelyScore.home;
    correctScoreAway = input.poissonMostLikelyScore.away;
    // Calculate exact score probability from Poisson if we have first-half data (means full Poisson is computed)
    if (input.poissonFirstHalfHome !== undefined) {
      // Approximate: use the lambda values to get the raw probability
      const homeExp = (homeGoalAvg.scored + awayGoalAvg.conceded) / 2;
      const awayExp = (awayGoalAvg.scored + homeGoalAvg.conceded) / 2;
      correctScoreProbability = inlinePoissonProb(homeExp, correctScoreHome) * inlinePoissonProb(awayExp, correctScoreAway) * 100;
    }
  } else {
    const homeExpectedGoals = (homeGoalAvg.scored + awayGoalAvg.conceded) / 2;
    const awayExpectedGoals = (awayGoalAvg.scored + homeGoalAvg.conceded) / 2;
    correctScoreHome = Math.round(homeExpectedGoals);
    correctScoreAway = Math.round(awayExpectedGoals);
  }

  predictions.push({
    type: 'Doğru Skor',
    prediction: `${correctScoreHome}-${correctScoreAway}`,
    confidence: 'düşük',
    reasoning: `Poisson dağılımının en olası skoru. Doğru skor tahmini doğası gereği düşük güvenilirliğe sahiptir.`,
    probability: correctScoreProbability,
  });

  // 5. İlk Yarı Sonucu - Yarı-Poisson modeli
  let firstHalfPrediction: string;
  let firstHalfConfidence: 'düşük' | 'orta' | 'yüksek' = 'orta';
  let firstHalfReasoning: string;
  let firstHalfProbability: number | undefined;

  if (input.poissonFirstHalfHome !== undefined && input.poissonFirstHalfAway !== undefined) {
    const fhHome = input.poissonFirstHalfHome;
    const fhAway = input.poissonFirstHalfAway;
    const fhDiff = fhHome - fhAway;

    // Calculate first half result probabilities using Poisson
    let fhHomeWinProb = 0;
    let fhDrawProb = 0;
    let fhAwayWinProb = 0;
    for (let h = 0; h <= 4; h++) {
      for (let a = 0; a <= 4; a++) {
        const prob = inlinePoissonProb(fhHome, h) * inlinePoissonProb(fhAway, a);
        if (h > a) fhHomeWinProb += prob;
        else if (h === a) fhDrawProb += prob;
        else fhAwayWinProb += prob;
      }
    }
    fhHomeWinProb *= 100;
    fhDrawProb *= 100;
    fhAwayWinProb *= 100;

    const maxFhProb = Math.max(fhHomeWinProb, fhDrawProb, fhAwayWinProb);

    if (fhDiff > 0.3) {
      firstHalfPrediction = homeTeamName;
      firstHalfConfidence = fhDiff > 0.5 ? 'orta' : 'düşük';
      firstHalfProbability = fhHomeWinProb;
      firstHalfReasoning = `İlk yarı beklenen gol: ${homeTeamName} ${fhHome.toFixed(2)} - ${awayTeamName} ${fhAway.toFixed(2)}. Ev sahibi erken baskı kurabilir.`;
    } else if (fhDiff < -0.3) {
      firstHalfPrediction = awayTeamName;
      firstHalfConfidence = fhDiff < -0.5 ? 'orta' : 'düşük';
      firstHalfProbability = fhAwayWinProb;
      firstHalfReasoning = `İlk yarı beklenen gol: ${homeTeamName} ${fhHome.toFixed(2)} - ${awayTeamName} ${fhAway.toFixed(2)}. Deplasman takımı avantajlı.`;
    } else {
      firstHalfPrediction = 'Beraberlik';
      firstHalfConfidence = 'orta';
      firstHalfProbability = fhDrawProb;
      firstHalfReasoning = `İlk yarı beklenen gol çok yakın (${fhHome.toFixed(2)} vs ${fhAway.toFixed(2)}). İlk yarı beraberlik bekleniyor.`;
    }
  } else {
    firstHalfPrediction = scoreDiff > 15 ? homeTeamName : scoreDiff < -15 ? awayTeamName : 'Beraberlik';
    firstHalfReasoning = `Takımların temkinli başlama eğilimleri değerlendirildi. ${firstHalfPrediction === 'Beraberlik' ? 'Dengeli güçler beraberliğe işaret ediyor.' : `${firstHalfPrediction} erken baskı kurmayı tercih ediyor.`}`;
  }
  
  predictions.push({
    type: 'İlk Yarı Sonucu',
    prediction: firstHalfPrediction,
    confidence: firstHalfConfidence,
    reasoning: firstHalfReasoning,
    probability: firstHalfProbability,
  });

  // 6. İY/MS (HT/FT) - İlk yarı × Maç sonu çapraz matris
  if (input.poissonFirstHalfHome !== undefined && input.poissonFirstHalfAway !== undefined &&
      pHomeWin !== undefined && pDraw !== undefined && pAwayWin !== undefined) {
    const fhHome = input.poissonFirstHalfHome;
    const fhAway = input.poissonFirstHalfAway;
    
    // Calculate first half probabilities
    let fhHomeWinProb = 0, fhDrawProb = 0, fhAwayWinProb = 0;
    for (let h = 0; h <= 4; h++) {
      for (let a = 0; a <= 4; a++) {
        const prob = inlinePoissonProb(fhHome, h) * inlinePoissonProb(fhAway, a);
        if (h > a) fhHomeWinProb += prob;
        else if (h === a) fhDrawProb += prob;
        else fhAwayWinProb += prob;
      }
    }

    // Full-time probabilities (already 0-100 range)
    const ftHome = pHomeWin / 100;
    const ftDraw = pDraw / 100;
    const ftAway = pAwayWin / 100;

    // 9-way HT/FT combinations with conditional probability adjustment
    // P(HT=X, FT=Y) ≈ P(HT=X) × P(FT=Y | HT=X)
    // Simplified: use cross product with small correlation adjustments
    const htftCombinations = [
      { ht: 'Ev', ft: 'Ev', prob: fhHomeWinProb * ftHome * 1.3 },      // Leading team more likely to win
      { ht: 'Ev', ft: 'Ber', prob: fhHomeWinProb * ftDraw * 0.7 },     // Less likely to lose lead to draw
      { ht: 'Ev', ft: 'Dep', prob: fhHomeWinProb * ftAway * 0.4 },     // Rare comeback
      { ht: 'Ber', ft: 'Ev', prob: fhDrawProb * ftHome * 0.9 },
      { ht: 'Ber', ft: 'Ber', prob: fhDrawProb * ftDraw * 1.4 },       // Drawn at HT often stays drawn
      { ht: 'Ber', ft: 'Dep', prob: fhDrawProb * ftAway * 0.9 },
      { ht: 'Dep', ft: 'Ev', prob: fhAwayWinProb * ftHome * 0.4 },     // Rare comeback
      { ht: 'Dep', ft: 'Ber', prob: fhAwayWinProb * ftDraw * 0.7 },
      { ht: 'Dep', ft: 'Dep', prob: fhAwayWinProb * ftAway * 1.3 },
    ];

    // Normalize probabilities
    const totalProb = htftCombinations.reduce((sum, c) => sum + c.prob, 0);
    htftCombinations.forEach(c => { c.prob = (c.prob / totalProb) * 100; });

    // Find the most likely HT/FT combination
    htftCombinations.sort((a, b) => b.prob - a.prob);
    const bestHtft = htftCombinations[0];
    const htftProbability = bestHtft.prob;

    let htftConfidence: 'düşük' | 'orta' | 'yüksek' = 'düşük';
    if (htftProbability > 30) htftConfidence = 'yüksek';
    else if (htftProbability > 20) htftConfidence = 'orta';

    const htLabel = bestHtft.ht === 'Ev' ? homeTeamName : bestHtft.ht === 'Dep' ? awayTeamName : 'Beraberlik';
    const ftLabel = bestHtft.ft === 'Ev' ? homeTeamName : bestHtft.ft === 'Dep' ? awayTeamName : 'Beraberlik';

    predictions.push({
      type: 'İlk Yarı / Maç Sonucu',
      prediction: `${bestHtft.ht} / ${bestHtft.ft}`,
      confidence: htftConfidence,
      reasoning: `İY/MS çapraz matris: ${htLabel} (İY) / ${ftLabel} (MS) — %${htftProbability.toFixed(1)} olasılık. İlk yarı beklenen gol: ${fhHome.toFixed(2)}-${fhAway.toFixed(2)}.`,
      probability: htftProbability,
    });
  }

  // 7. İlk Yarı Alt/Üst 0.5 - Yarı-Poisson goal line
  if (input.poissonFirstHalfHome !== undefined && input.poissonFirstHalfAway !== undefined) {
    const fhHome = input.poissonFirstHalfHome;
    const fhAway = input.poissonFirstHalfAway;
    const fhTotalExpected = fhHome + fhAway;

    // Calculate first half over 0.5 probability
    const p00 = inlinePoissonProb(fhHome, 0) * inlinePoissonProb(fhAway, 0);
    const fhOver05 = (1 - p00) * 100;

    // Calculate first half over 1.5 probability
    let fhUnder15Prob = 0;
    for (let h = 0; h <= 1; h++) {
      for (let a = 0; a <= 1; a++) {
        if (h + a <= 1) {
          fhUnder15Prob += inlinePoissonProb(fhHome, h) * inlinePoissonProb(fhAway, a);
        }
      }
    }
    const fhOver15 = (1 - fhUnder15Prob) * 100;

    // Pick the most actionable line (0.5 or 1.5)
    let fhGoalPrediction: string;
    let fhGoalConfidence: 'düşük' | 'orta' | 'yüksek';
    let fhGoalProbability: number;
    let fhGoalReasoning: string;

    // Prefer 0.5 line when over probability is high, or 1.5 when appropriate
    if (fhOver05 > 75) {
      fhGoalPrediction = 'İY 0.5 Üst';
      fhGoalConfidence = fhOver05 > 85 ? 'yüksek' : 'orta';
      fhGoalProbability = fhOver05;
      fhGoalReasoning = `İlk yarıda en az 1 gol olasılığı %${fhOver05.toFixed(0)}. Beklenen ilk yarı gol: ${fhTotalExpected.toFixed(2)}.`;
    } else if (fhOver05 < 50) {
      fhGoalPrediction = 'İY 0.5 Alt';
      fhGoalConfidence = fhOver05 < 35 ? 'yüksek' : 'orta';
      fhGoalProbability = 100 - fhOver05;
      fhGoalReasoning = `İlk yarıda golsüz kalma olasılığı %${(100 - fhOver05).toFixed(0)}. Savunma ağırlıklı başlangıç bekleniyor.`;
    } else if (fhOver15 > 55) {
      fhGoalPrediction = 'İY 1.5 Üst';
      fhGoalConfidence = fhOver15 > 65 ? 'orta' : 'düşük';
      fhGoalProbability = fhOver15;
      fhGoalReasoning = `İlk yarıda 2+ gol olasılığı %${fhOver15.toFixed(0)}. Hücum ağırlıklı bir başlangıç bekleniyor.`;
    } else {
      fhGoalPrediction = 'İY 1.5 Alt';
      fhGoalConfidence = 'orta';
      fhGoalProbability = 100 - fhOver15;
      fhGoalReasoning = `İlk yarıda 1 veya daha az gol olasılığı %${(100 - fhOver15).toFixed(0)}. Temkinli bir başlangıç bekleniyor.`;
    }

    predictions.push({
      type: 'İki Yarıda da Gol',
      prediction: fhGoalPrediction,
      confidence: fhGoalConfidence,
      reasoning: fhGoalReasoning,
      probability: fhGoalProbability,
    });
  }

  return predictions;
}

function generateTacticalAnalysis(
  homeStanding: Standing,
  awayStanding: Standing,
  homeFormScore: number,
  awayFormScore: number
): string {
  const homeName = homeStanding.team.name;
  const awayName = awayStanding.team.name;
  const homeAvgGoals = (homeStanding.goalsFor / homeStanding.playedGames).toFixed(2);
  const awayAvgGoals = (awayStanding.goalsFor / awayStanding.playedGames).toFixed(2);
  
  let analysis = `${homeName} bu sezon maç başına ${homeAvgGoals} gol ortalamasıyla `;
  analysis += homeStanding.position <= 5 ? 'zirvede mücadele ediyor. ' : homeStanding.position <= 10 ? 'üst sıralarda yer alıyor. ' : 'orta sıralarda konumlanıyor. ';
  
  analysis += `${awayName} ise ${awayAvgGoals} gol ortalamasıyla `;
  analysis += awayStanding.position <= 5 ? 'liderlik yarışında. ' : awayStanding.position <= 10 ? 'Avrupa kupalarını hedefliyor. ' : 'istikrar arıyor. ';
  
  if (homeFormScore > awayFormScore + 20) {
    analysis += `Form farkı ${homeName} lehine belirgin. Ev sahibi takımın baskılı oyunu bekleniyor.`;
  } else if (awayFormScore > homeFormScore + 20) {
    analysis += `${awayName}'nin üstün formu dikkat çekiyor. Kontra atak odaklı bir deplasman planı beklenebilir.`;
  } else {
    analysis += `Her iki takım da benzer formda. Orta saha mücadelesinin sonucu belirleyeceği taktiksel bir maç bekleniyor.`;
  }

  return analysis;
}

function generateKeyFactors(
  homeStanding: Standing,
  awayStanding: Standing,
  homeFormScore: number,
  awayFormScore: number,
  h2h: HeadToHead
): string[] {
  const factors: string[] = [];
  
  if (homeStanding.position <= 4) {
    factors.push(`${homeStanding.team.name} şampiyonluk yarışında (${homeStanding.position}. sıra, ${homeStanding.points} puan)`);
  }
  if (awayStanding.position <= 4) {
    factors.push(`${awayStanding.team.name} liderlik mücadelesinde (${awayStanding.position}. sıra, ${awayStanding.points} puan)`);
  }
  
  if (homeFormScore >= 70) {
    factors.push(`${homeStanding.team.name} son 5 maçta üstün form (${homeFormScore}% performans)`);
  }
  if (awayFormScore >= 70) {
    factors.push(`${awayStanding.team.name} mükemmel deplasman serisi (${awayFormScore}% performans)`);
  }
  
  const homeGoalAvg = homeStanding.goalsFor / homeStanding.playedGames;
  const awayGoalAvg = awayStanding.goalsFor / awayStanding.playedGames;
  
  if (homeGoalAvg > 2) {
    factors.push(`${homeStanding.team.name} gol makinesi: maç başına ${homeGoalAvg.toFixed(1)} gol`);
  }
  if (awayGoalAvg > 2) {
    factors.push(`${awayStanding.team.name} hücum gücü: maç başına ${awayGoalAvg.toFixed(1)} gol`);
  }
  
  if (h2h.lastMatches.length > 0) {
    const totalH2H = h2h.homeWins + h2h.awayWins + h2h.draws;
    factors.push(`Son ${totalH2H} karşılaşma: ${h2h.homeWins} ev sahibi, ${h2h.awayWins} deplasman, ${h2h.draws} beraberlik`);
  }
  
  const homeDefense = homeStanding.goalsAgainst / homeStanding.playedGames;
  const awayDefense = awayStanding.goalsAgainst / awayStanding.playedGames;
  
  if (homeDefense < 1) {
    factors.push(`${homeStanding.team.name} sağlam savunma: maç başına ${homeDefense.toFixed(1)} gol yiyor`);
  }
  if (awayDefense < 1) {
    factors.push(`${awayStanding.team.name} defansif güç: maç başına ${awayDefense.toFixed(1)} gol yiyor`);
  }

  return factors.slice(0, 5);
}

// Mock veriden gerçek veriye geçiş için fallback
export function generateMockPrediction(
  homeTeamName: string,
  awayTeamName: string,
  league: string,
  matchDate: string
): MatchAnalysis {
  return {
    input: { league, homeTeam: homeTeamName, awayTeam: awayTeamName, matchDate },
    homeTeamStats: {
      form: ['W', 'D', 'W', 'L', 'W'],
      goalsScored: 1.8,
      goalsConceded: 0.9,
      homePerformance: { wins: 5, draws: 2, losses: 2 },
    },
    awayTeamStats: {
      form: ['L', 'W', 'D', 'W', 'D'],
      goalsScored: 1.5,
      goalsConceded: 1.2,
      awayPerformance: { wins: 3, draws: 3, losses: 3 },
    },
    headToHead: {
      lastMatches: [],
      homeWins: 3,
      awayWins: 2,
      draws: 2,
    },
    predictions: [
      { type: 'Maç Sonucu', prediction: `${homeTeamName} Kazanır`, confidence: 'orta', reasoning: 'Ev sahibi avantajı etkili.' },
      { type: 'Toplam Gol Alt/Üst', prediction: '2.5 Üst', confidence: 'orta', reasoning: 'Gol ortalamaları yüksek.' },
      { type: 'Karşılıklı Gol', prediction: 'Evet', confidence: 'orta', reasoning: 'Her iki takım da gol atabiliyor.' },
    ],
    tacticalAnalysis: 'Detaylı analiz için API verisi gerekiyor.',
    keyFactors: ['Ev sahibi avantajı', 'Form durumu belirsiz'],
    injuries: { home: [], away: [] },
  };
}
