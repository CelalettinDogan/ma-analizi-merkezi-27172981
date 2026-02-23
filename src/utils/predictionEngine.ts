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
  // Ev sahibi takımın ev performansını, deplasman takımının deplasman performansıyla karşılaştır
  const homePoints = homeStanding.points;
  const awayPoints = awayStanding.points;
  
  const pointDiff = homePoints - awayPoints;
  
  // Ev sahibi avantajı olarak +10% bonus ekle
  const homeBonus = 10;
  
  // -30 ile +30 arası normalize et
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

    // Şu anki maç için ev sahibi olan takım açısından değerlendir
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
  
  // H2H analizi
  const h2h = analyzeH2H(h2hMatches, homeTeam.standing.team.id, awayTeam.standing.team.id);
  
  // Form dizisini oluştur
  const homeForm = homeTeam.standing.form?.split(',').slice(-5) || [];
  const awayForm = awayTeam.standing.form?.split(',').slice(-5) || [];

  // TeamStats oluştur
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

  // Tahminleri hesapla
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

  // Taktik analiz oluştur
  const tacticalAnalysis = generateTacticalAnalysis(
    homeTeam.standing,
    awayTeam.standing,
    homeFormScore,
    awayFormScore
  );

  // Önemli faktörler
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
    injuries: { home: [], away: [] }, // API'de sakatlık verisi yok
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

  const pHomeWin = input.poissonHomeWinProb;
  const pDraw = input.poissonDrawProb;
  const pAwayWin = input.poissonAwayWinProb;

  if (pHomeWin !== undefined && pDraw !== undefined && pAwayWin !== undefined) {
    // Poisson tabanlı karar (daha güvenilir)
    const maxProb = Math.max(pHomeWin, pDraw, pAwayWin);
    
    if (pHomeWin > 55 && pHomeWin === maxProb) {
      matchResult = `${homeTeamName} Kazanır`;
      matchConfidence = 'yüksek';
      matchReasoning = `Poisson modeli %${pHomeWin.toFixed(0)} olasılıkla ev sahibi galibiyeti gösteriyor. ${homeTeamName} ${homePosition}. sırada.`;
    } else if (pHomeWin > 45 && pHomeWin === maxProb) {
      matchResult = `${homeTeamName} Kazanır`;
      matchConfidence = 'orta';
      matchReasoning = `Poisson modeli %${pHomeWin.toFixed(0)} olasılıkla ${homeTeamName} hafif favori. Ev sahibi avantajı etkili.`;
    } else if (pAwayWin > 55 && pAwayWin === maxProb) {
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
      // En yüksek olasılıklı sonuç ama düşük güvenle
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
    // Fallback: eski form bazlı mantık
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
  });

  // 2. Toplam Gol Tahmini (Alt/Üst 2.5) - Poisson tabanlı
  const expectedGoals = (homeGoalAvg.scored + awayGoalAvg.scored + homeGoalAvg.conceded + awayGoalAvg.conceded) / 2;
  const over25Prob = input.poissonOver25Prob; // 0-1 range
  
  let goalPrediction: string;
  let goalConfidence: 'düşük' | 'orta' | 'yüksek';
  let goalReasoning: string;

  if (over25Prob !== undefined) {
    // Poisson tabanlı karar (daha güvenilir)
    const probPct = (over25Prob * 100).toFixed(0);
    const leagueInfo = input.leagueOver25Pct ? ` Lig ortalaması: %${input.leagueOver25Pct.toFixed(0)}.` : '';
    
    if (over25Prob > 0.60) {
      goalPrediction = '2.5 Üst';
      goalConfidence = 'yüksek';
      goalReasoning = `Poisson modeli %${probPct} olasılıkla 2.5 üstü gösteriyor.${leagueInfo} Beklenen toplam: ${expectedGoals.toFixed(1)} gol.`;
    } else if (over25Prob > 0.55) {
      goalPrediction = '2.5 Üst';
      goalConfidence = 'orta';
      goalReasoning = `Poisson modeli %${probPct} olasılıkla hafif üst yönde.${leagueInfo} ${homeTeamName} ${homeGoalAvg.scored.toFixed(2)}, ${awayTeamName} ${awayGoalAvg.scored.toFixed(2)} gol ortalamasına sahip.`;
    } else if (over25Prob < 0.40) {
      goalPrediction = '2.5 Alt';
      goalConfidence = 'yüksek';
      goalReasoning = `Poisson modeli %${(100 - over25Prob * 100).toFixed(0)} olasılıkla alt gösteriyor.${leagueInfo} Düşük gol beklentisi: ${expectedGoals.toFixed(1)}.`;
    } else if (over25Prob < 0.45) {
      goalPrediction = '2.5 Alt';
      goalConfidence = 'orta';
      goalReasoning = `Poisson modeli %${(100 - over25Prob * 100).toFixed(0)} olasılıkla alt yönünde.${leagueInfo} Savunma ağırlıklı maç bekleniyor.`;
    } else {
      // %45-55 SINIR BÖLGESİ - temkinli ol
      goalPrediction = over25Prob >= 0.50 ? '2.5 Üst' : '2.5 Alt';
      goalConfidence = 'düşük';
      goalReasoning = `⚠️ Sınır bölge: Poisson modeli %${probPct} olasılık hesapladı.${leagueInfo} Belirsiz durum, düşük güven.`;
    }
  } else {
    // Poisson yoksa eski basit mantık (fallback)
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
  });

  // 3. Karşılıklı Gol - Poisson tabanlı
  const pBtts = input.poissonBttsProb; // 0-100
  
  let bttsResult: string;
  let bttsConfidence: 'düşük' | 'orta' | 'yüksek';
  let bttsReasoning: string;

  if (pBtts !== undefined) {
    if (pBtts > 65) {
      bttsResult = 'Evet';
      bttsConfidence = 'yüksek';
      bttsReasoning = `Poisson modeli %${pBtts.toFixed(0)} karşılıklı gol olasılığı hesapladı. Her iki takım da gol atma kapasitesine sahip.`;
    } else if (pBtts > 55) {
      bttsResult = 'Evet';
      bttsConfidence = 'orta';
      bttsReasoning = `Poisson modeli %${pBtts.toFixed(0)} karşılıklı gol olasılığı gösteriyor. ${homeTeamName} ${homeGoalAvg.conceded.toFixed(2)} gol yiyor.`;
    } else if (pBtts < 35) {
      bttsResult = 'Hayır';
      bttsConfidence = 'yüksek';
      bttsReasoning = `Poisson modeli %${(100 - pBtts).toFixed(0)} olasılıkla bir takımın gol atamayacağını gösteriyor.`;
    } else if (pBtts < 45) {
      bttsResult = 'Hayır';
      bttsConfidence = 'orta';
      bttsReasoning = `Poisson modeli %${(100 - pBtts).toFixed(0)} olasılıkla karşılıklı gol beklemiyor. Savunma ağırlıklı maç.`;
    } else {
      // %45-55 sınır bölgesi
      bttsResult = pBtts >= 50 ? 'Evet' : 'Hayır';
      bttsConfidence = 'düşük';
      bttsReasoning = `⚠️ Sınır bölge: Poisson BTTS olasılığı %${pBtts.toFixed(0)}. Belirsiz durum.`;
    }
  } else {
    // Fallback: eski basit mantık
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
  });

  // 4. Doğru Skor Tahmini - Poisson en olası skor
  let correctScoreHome: number;
  let correctScoreAway: number;
  
  if (input.poissonMostLikelyScore) {
    correctScoreHome = input.poissonMostLikelyScore.home;
    correctScoreAway = input.poissonMostLikelyScore.away;
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
  });

  // 5. İlk Yarı Sonucu - Yarı-Poisson modeli
  let firstHalfPrediction: string;
  let firstHalfConfidence: 'düşük' | 'orta' | 'yüksek' = 'orta';
  let firstHalfReasoning: string;

  if (input.poissonFirstHalfHome !== undefined && input.poissonFirstHalfAway !== undefined) {
    const fhDiff = input.poissonFirstHalfHome - input.poissonFirstHalfAway;
    if (fhDiff > 0.3) {
      firstHalfPrediction = homeTeamName;
      firstHalfConfidence = fhDiff > 0.5 ? 'orta' : 'düşük';
      firstHalfReasoning = `İlk yarı beklenen gol: ${homeTeamName} ${input.poissonFirstHalfHome.toFixed(2)} - ${awayTeamName} ${input.poissonFirstHalfAway.toFixed(2)}. Ev sahibi erken baskı kurabilir.`;
    } else if (fhDiff < -0.3) {
      firstHalfPrediction = awayTeamName;
      firstHalfConfidence = fhDiff < -0.5 ? 'orta' : 'düşük';
      firstHalfReasoning = `İlk yarı beklenen gol: ${homeTeamName} ${input.poissonFirstHalfHome.toFixed(2)} - ${awayTeamName} ${input.poissonFirstHalfAway.toFixed(2)}. Deplasman takımı avantajlı.`;
    } else {
      firstHalfPrediction = 'Beraberlik';
      firstHalfConfidence = 'orta';
      firstHalfReasoning = `İlk yarı beklenen gol çok yakın (${input.poissonFirstHalfHome.toFixed(2)} vs ${input.poissonFirstHalfAway.toFixed(2)}). İlk yarı beraberlik bekleniyor.`;
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
  });

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
  
  // Puan durumu faktörü
  if (homeStanding.position <= 4) {
    factors.push(`${homeStanding.team.name} şampiyonluk yarışında (${homeStanding.position}. sıra, ${homeStanding.points} puan)`);
  }
  if (awayStanding.position <= 4) {
    factors.push(`${awayStanding.team.name} liderlik mücadelesinde (${awayStanding.position}. sıra, ${awayStanding.points} puan)`);
  }
  
  // Form faktörü
  if (homeFormScore >= 70) {
    factors.push(`${homeStanding.team.name} son 5 maçta üstün form (${homeFormScore}% performans)`);
  }
  if (awayFormScore >= 70) {
    factors.push(`${awayStanding.team.name} mükemmel deplasman serisi (${awayFormScore}% performans)`);
  }
  
  // Gol faktörleri
  const homeGoalAvg = homeStanding.goalsFor / homeStanding.playedGames;
  const awayGoalAvg = awayStanding.goalsFor / awayStanding.playedGames;
  
  if (homeGoalAvg > 2) {
    factors.push(`${homeStanding.team.name} gol makinesi: maç başına ${homeGoalAvg.toFixed(1)} gol`);
  }
  if (awayGoalAvg > 2) {
    factors.push(`${awayStanding.team.name} hücum gücü: maç başına ${awayGoalAvg.toFixed(1)} gol`);
  }
  
  // H2H faktörü
  if (h2h.lastMatches.length > 0) {
    const totalH2H = h2h.homeWins + h2h.awayWins + h2h.draws;
    factors.push(`Son ${totalH2H} karşılaşma: ${h2h.homeWins} ev sahibi, ${h2h.awayWins} deplasman, ${h2h.draws} beraberlik`);
  }
  
  // Savunma faktörü
  const homeDefense = homeStanding.goalsAgainst / homeStanding.playedGames;
  const awayDefense = awayStanding.goalsAgainst / awayStanding.playedGames;
  
  if (homeDefense < 1) {
    factors.push(`${homeStanding.team.name} sağlam savunma: maç başına ${homeDefense.toFixed(1)} gol yiyor`);
  }
  if (awayDefense < 1) {
    factors.push(`${awayStanding.team.name} defansif güç: maç başına ${awayDefense.toFixed(1)} gol yiyor`);
  }

  return factors.slice(0, 5); // En fazla 5 faktör
}

// Mock veriden gerçek veriye geçiş için fallback
export function generateMockPrediction(
  homeTeamName: string,
  awayTeamName: string,
  league: string,
  matchDate: string
): MatchAnalysis {
  // Basit mock veri döndür (API çalışmadığında)
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
