import { useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import { MatchInput, MatchAnalysis, Prediction, MatchInsights, MatchContext, TeamPower, PoissonData, GoalLineProbabilities } from '@/types/match';
import { supabase } from '@/integrations/supabase/client';
import { CompetitionCode, Standing, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { getStandings, getFinishedMatches, getHeadToHead } from '@/services/footballApiService';
import { generatePrediction, generateMockPrediction } from '@/utils/predictionEngine';
import { savePredictions } from '@/services/predictionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { extractTeamFeatures, extractH2HFeatures, createFeatureRecord, extractMatchFeatures } from '@/utils/featureExtractor';
import { 
  getMLPrediction, 
  aiConfidenceToString, 
  convertAIResultToDisplay, 
  convertGoalsPrediction, 
  convertBTTSPrediction,
  savePredictionFeatures,
  getAIMathWeights
} from '@/services/mlPredictionService';
import { calculatePoissonExpectedGoals, generateScoreProbabilities, calculateMatchResultProbabilities, calculateGoalLineProbabilities as calcGoalLines, calculateBTTSProbability, calculatePowerIndexes, getMostLikelyScores } from '@/utils/poissonCalculator';
import { calculateMatchImportance, calculateMomentum, calculateCleanSheetRatio } from '@/utils/contextAnalyzer';
import { isDerbyMatch } from '@/utils/derbyDetector';

// Hibrit güven hesaplama - dinamik ağırlıklarla
function calculateHybridConfidence(
  aiConfidence: number,
  mathConfidence: number,
  dynamicWeights?: { aiWeight: number; mathWeight: number } | null
): 'düşük' | 'orta' | 'yüksek' {
  let hybrid: number;
  if (dynamicWeights) {
    hybrid = aiConfidence * dynamicWeights.aiWeight + mathConfidence * dynamicWeights.mathWeight;
  } else {
    // Varsayılan: 40% AI, 40% Math, 20% baseline
    hybrid = aiConfidence * 0.4 + mathConfidence * 0.4 + 0.5 * 0.2;
  }
  if (hybrid >= 0.7) return 'yüksek';
  if (hybrid >= 0.5) return 'orta';
  return 'düşük';
}

// Matematiksel güven değerini number'a çevir
function mathConfidenceToNumber(confidence: 'düşük' | 'orta' | 'yüksek'): number {
  switch (confidence) {
    case 'yüksek': return 0.8;
    case 'orta': return 0.6;
    case 'düşük': return 0.4;
  }
}

// Form string'inden skor hesapla (0-100)
function calculateFormScore(form: string | null): number {
  if (!form) return 50;
  let score = 0;
  const chars = form.split('');
  chars.forEach((char, index) => {
    const weight = (chars.length - index) / chars.length;
    if (char === 'W') score += 20 * weight;
    else if (char === 'D') score += 10 * weight;
    // L = 0
  });
  return Math.min(Math.round(score), 100);
}

export function useMatchAnalysis() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // CL sınırlı analiz modu: standings eksik takımlar için H2H + AI ile analiz
  const runLimitedAnalysis = async (
    data: MatchInput,
    homeStanding: Standing | undefined,
    awayStanding: Standing | undefined
  ): Promise<MatchAnalysis> => {
    // Varsayılan standing oluştur (bulunamayan takımlar için)
    const createDefaultStanding = (teamName: string, teamId?: number, crest?: string): Standing => ({
      position: 0,
      team: { id: teamId || 0, name: teamName, shortName: teamName, tla: '', crest: crest || '' },
      playedGames: 20,
      form: null,
      won: 8, draw: 6, lost: 6,
      points: 30,
      goalsFor: 28, goalsAgainst: 24, goalDifference: 4,
    });

    const effectiveHome = homeStanding || createDefaultStanding(data.homeTeam, data.homeTeamId, data.homeTeamCrest);
    const effectiveAway = awayStanding || createDefaultStanding(data.awayTeam, data.awayTeamId, data.awayTeamCrest);

    // H2H verisi çek
    let h2hFilteredMatches: any[] = [];
    if (data.matchId) {
      try {
        const h2hResponse = await getHeadToHead(data.matchId);
        if (h2hResponse?.matches && Array.isArray(h2hResponse.matches)) {
          h2hFilteredMatches = h2hResponse.matches.map((m: any) => ({
            id: m.id, utcDate: m.utcDate, status: m.status, matchday: m.matchday || 0,
            homeTeam: { id: m.homeTeam?.id || 0, name: m.homeTeam?.name || 'Unknown', shortName: m.homeTeam?.shortName || m.homeTeam?.name || 'Unknown', tla: m.homeTeam?.tla || '', crest: m.homeTeam?.crest || '' },
            awayTeam: { id: m.awayTeam?.id || 0, name: m.awayTeam?.name || 'Unknown', shortName: m.awayTeam?.shortName || m.awayTeam?.name || 'Unknown', tla: m.awayTeam?.tla || '', crest: m.awayTeam?.crest || '' },
            score: { winner: m.score?.winner || null, fullTime: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null }, halfTime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null } },
            competition: { id: m.competition?.id || 0, code: m.competition?.code || 'CL', name: m.competition?.name || '', emblem: m.competition?.emblem || '', area: m.area || { id: 0, name: '', code: '', flag: '' } },
          }));
        }
      } catch (e) { console.warn('[limitedAnalysis] H2H fetch failed:', e); }
    }

    // Matematiksel tahmin (varsayılan verilerle)
    const mathResult = generatePrediction({
      homeTeam: { standing: effectiveHome, recentMatches: [] },
      awayTeam: { standing: effectiveAway, recentMatches: [] },
      h2hMatches: h2hFilteredMatches,
      league: data.league,
      matchDate: data.matchDate,
    });

    const features = extractMatchFeatures(effectiveHome, effectiveAway, mathResult.headToHead);

    // Poisson (varsayılan lig ortalamaları ile)
    const leagueAvgScored = 1.35;
    const leagueAvgConceded = 1.35;
    const homeAS = (effectiveHome.goalsFor / effectiveHome.playedGames) / leagueAvgScored;
    const homeDS = (effectiveHome.goalsAgainst / effectiveHome.playedGames) / leagueAvgConceded;
    const awayAS = (effectiveAway.goalsFor / effectiveAway.playedGames) / leagueAvgScored;
    const awayDS = (effectiveAway.goalsAgainst / effectiveAway.playedGames) / leagueAvgConceded;
    const expectedGoals = calculatePoissonExpectedGoals(homeAS, homeDS, awayAS, awayDS, leagueAvgScored, leagueAvgConceded);
    const scoreProbabilities = generateScoreProbabilities(expectedGoals.homeExpected, expectedGoals.awayExpected);
    const rawGoalLines = calcGoalLines(scoreProbabilities);
    const bttsProbability = calculateBTTSProbability(scoreProbabilities);

    const goalLineProbabilities: GoalLineProbabilities = {
      over05: rawGoalLines.over0_5 / 100, over15: rawGoalLines.over1_5 / 100,
      over25: rawGoalLines.over2_5 / 100, over35: rawGoalLines.over3_5 / 100,
      under05: rawGoalLines.under0_5 / 100, under15: rawGoalLines.under1_5 / 100,
      under25: rawGoalLines.under2_5 / 100, under35: rawGoalLines.under3_5 / 100,
    };

    const poissonData: PoissonData = {
      scoreProbabilities: scoreProbabilities.map(sp => ({ homeGoals: sp.homeGoals, awayGoals: sp.awayGoals, probability: sp.probability / 100 })),
      goalLineProbabilities, bttsProbability: bttsProbability / 100,
      expectedHomeGoals: expectedGoals.homeExpected, expectedAwayGoals: expectedGoals.awayExpected,
    };

    const homePowerIndexes = calculatePowerIndexes(effectiveHome.goalsFor, effectiveHome.goalsAgainst, effectiveHome.playedGames, leagueAvgScored, leagueAvgConceded);
    const awayPowerIndexes = calculatePowerIndexes(effectiveAway.goalsFor, effectiveAway.goalsAgainst, effectiveAway.playedGames, leagueAvgScored, leagueAvgConceded);

    const homePower: TeamPower = { attackIndex: homePowerIndexes.attackStrength * 100, defenseIndex: (2 - homePowerIndexes.defenseStrength) * 100, overallPower: homePowerIndexes.overallPower * 100, formScore: calculateFormScore(effectiveHome.form) };
    const awayPower: TeamPower = { attackIndex: awayPowerIndexes.attackStrength * 100, defenseIndex: (2 - awayPowerIndexes.defenseStrength) * 100, overallPower: awayPowerIndexes.overallPower * 100, formScore: calculateFormScore(effectiveAway.form) };

    const isDerby = isDerbyMatch(data.homeTeam, data.awayTeam, data.league);
    const context: MatchContext = {
      matchImportance: 'high', seasonPhase: 'mid', isDerby,
      homeMomentum: calculateMomentum(effectiveHome.form), awayMomentum: calculateMomentum(effectiveAway.form),
      contextTags: ['Şampiyonlar Ligi', !homeStanding ? `${data.homeTeam} (sınırlı veri)` : '', !awayStanding ? `${data.awayTeam} (sınırlı veri)` : ''].filter(Boolean),
    };

    const insights: MatchInsights = {
      homeFormScore: homePower.formScore, awayFormScore: awayPower.formScore,
      homeMomentum: context.homeMomentum, awayMomentum: context.awayMomentum,
      isDerby, matchImportance: context.matchImportance,
      homeCleanSheetRatio: calculateCleanSheetRatio(effectiveHome.goalsAgainst, effectiveHome.playedGames),
      awayCleanSheetRatio: calculateCleanSheetRatio(effectiveAway.goalsAgainst, effectiveAway.playedGames),
      homeAttackIndex: homePower.attackIndex, awayAttackIndex: awayPower.attackIndex,
    };

    // AI tahminleri
    let finalPredictions: Prediction[] = mathResult.predictions;
    let isAIEnhanced = false;

    try {
      const mlResult = await getMLPrediction(features.homeTeam, features.awayTeam, features.h2h, data.league);
      if (mlResult?.success && mlResult.predictions) {
        isAIEnhanced = true;
        const ai = mlResult.predictions;
        finalPredictions = [
          { type: 'Maç Sonucu', prediction: convertAIResultToDisplay(ai.matchResult.prediction, effectiveHome.team.name, effectiveAway.team.name), confidence: calculateHybridConfidence(ai.matchResult.confidence, mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Maç Sonucu')?.confidence || 'orta'), null), reasoning: ai.matchResult.reasoning, isAIPowered: true, aiConfidence: ai.matchResult.confidence, mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Maç Sonucu')?.confidence || 'orta') },
          { type: 'Toplam Gol Alt/Üst', prediction: convertGoalsPrediction(ai.totalGoals.prediction), confidence: calculateHybridConfidence(ai.totalGoals.confidence, mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Toplam Gol Alt/Üst')?.confidence || 'orta'), null), reasoning: ai.totalGoals.reasoning, isAIPowered: true, aiConfidence: ai.totalGoals.confidence, mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Toplam Gol Alt/Üst')?.confidence || 'orta') },
          { type: 'Karşılıklı Gol', prediction: convertBTTSPrediction(ai.bothTeamsScore.prediction), confidence: calculateHybridConfidence(ai.bothTeamsScore.confidence, mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta'), null), reasoning: ai.bothTeamsScore.reasoning, isAIPowered: true, aiConfidence: ai.bothTeamsScore.confidence, mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta') },
          { type: 'Doğru Skor', prediction: ai.correctScore.prediction, confidence: aiConfidenceToString(ai.correctScore.confidence), reasoning: ai.correctScore.reasoning, isAIPowered: true, aiConfidence: ai.correctScore.confidence, mathConfidence: 0.3 },
          { type: 'İlk Yarı Sonucu', prediction: convertAIResultToDisplay(ai.firstHalf.prediction, effectiveHome.team.name, effectiveAway.team.name), confidence: calculateHybridConfidence(ai.firstHalf.confidence, mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta'), null), reasoning: ai.firstHalf.reasoning, isAIPowered: true, aiConfidence: ai.firstHalf.confidence, mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta') },
        ];
      }
    } catch (aiError) {
      console.error('[limitedAnalysis] AI prediction error:', aiError);
    }

    const missingTeams = [!homeStanding ? data.homeTeam : null, !awayStanding ? data.awayTeam : null].filter(Boolean);
    toast({
      title: '⚡ Şampiyonlar Ligi Analizi',
      description: missingTeams.length > 0
        ? `${missingTeams.join(' ve ')} için sınırlı veri ile analiz yapıldı. H2H + AI destekli.`
        : 'Takım verileri ulusal liglerden alındı. Tam analiz yapıldı.',
    });

    const result: MatchAnalysis = {
      ...mathResult,
      input: { ...mathResult.input, homeTeamCrest: effectiveHome.team.crest, awayTeamCrest: effectiveAway.team.crest },
      predictions: finalPredictions, isAIEnhanced,
      insights, context, homePower, awayPower, poissonData,
    };

    // Kaydet
    try {
      const predictionId = await savePredictions(data.league, result.input.homeTeam, result.input.awayTeam, data.matchDate, result.predictions, user?.id);
      if (predictionId) {
        const aiConf = result.predictions[0]?.aiConfidence || 0.5;
        const mathConf = result.predictions[0]?.mathConfidence || 0.5;
        const featureRecord = createFeatureRecord(features, aiConf, result.predictions[0]?.reasoning || '', mathConf, { homeExpected: expectedGoals.homeExpected, awayExpected: expectedGoals.awayExpected });
        await savePredictionFeatures(predictionId, featureRecord);
      }
    } catch (saveError) { console.error('[limitedAnalysis] Save error:', saveError); }

    return result;
  };

  const analyzeMatch = async (data: MatchInput) => {
    setIsLoading(true);

    // Fetch dynamic AI vs Math weights
    let dynamicWeights: { aiWeight: number; mathWeight: number } | null = null;
    try {
      dynamicWeights = await getAIMathWeights();
      if (dynamicWeights) {
        console.log(`[useMatchAnalysis] Dynamic weights: AI=${(dynamicWeights.aiWeight * 100).toFixed(1)}%, Math=${(dynamicWeights.mathWeight * 100).toFixed(1)}%`);
      }
    } catch (e) { console.warn('[useMatchAnalysis] Failed to fetch dynamic weights:', e); }
    try {
      // Lig kodunu bul
      const competition = SUPPORTED_COMPETITIONS.find(
        c => c.name === data.league || c.code === data.league
      );

      if (!competition) {
        // API desteklemiyor, mock veri kullan
        const mockAnalysis = generateMockPrediction(
          data.homeTeam,
          data.awayTeam,
          data.league,
          data.matchDate
        );
        setAnalysis(mockAnalysis);
        return mockAnalysis;
      }

      const competitionCode = competition.code as CompetitionCode;
      const isCL = competitionCode === 'CL';
      const domesticLeagues: CompetitionCode[] = ['PL', 'BL1', 'PD', 'SA', 'FL1'];

      // Paralel olarak verileri çek
      let standings: Standing[] = [];
      let recentMatches: any[] = [];

      if (isCL) {
        // CL maçları için tüm desteklenen liglerin standings'lerini paralel çek
        const allResults = await Promise.all(
          domesticLeagues.map(league => 
            Promise.all([getStandings(league), getFinishedMatches(league, 90)])
          )
        );
        // Tüm liglerin standings ve maçlarını birleştir
        for (const [leagueStandings, leagueMatches] of allResults) {
          standings = [...standings, ...leagueStandings];
          recentMatches = [...recentMatches, ...leagueMatches];
        }
      } else {
        [standings, recentMatches] = await Promise.all([
          getStandings(competitionCode),
          getFinishedMatches(competitionCode, 90),
        ]);
      }

      // Takımları bul (team_id veya isim eşleşmesi)
      const findTeam = (teamName: string, teamId?: number) => {
        if (teamId) {
          const byId = standings.find(s => s.team.id === teamId);
          if (byId) return byId;
        }
        return standings.find(
          s => s.team.name.toLowerCase().includes(teamName.toLowerCase()) ||
               teamName.toLowerCase().includes(s.team.name.toLowerCase())
        );
      };

      const homeStanding = findTeam(data.homeTeam, data.homeTeamId);
      const awayStanding = findTeam(data.awayTeam, data.awayTeamId);

      // CL: Takımlar bulunamadıysa sınırlı analiz moduna geç
      if (!homeStanding || !awayStanding) {
        if (isCL) {
          console.log('[useMatchAnalysis] CL limited analysis mode - missing standings for one or both teams');
          const limitedResult = await runLimitedAnalysis(data, homeStanding, awayStanding);
          setAnalysis(limitedResult);
          return limitedResult;
        }

        toast({
          title: 'Takım Bulunamadı',
          description: 'Girilen takım isimleri puan durumunda bulunamadı. Mock veri kullanılıyor.',
          variant: 'destructive',
        });
        
        const mockAnalysis = generateMockPrediction(
          data.homeTeam,
          data.awayTeam,
          data.league,
          data.matchDate
        );
        setAnalysis(mockAnalysis);
        return mockAnalysis;
      }

      // Try to get real H2H data from API if matchId is available
      let h2hFilteredMatches: typeof recentMatches = [];
      
      if (data.matchId) {
        try {
          console.log(`[useMatchAnalysis] Fetching real H2H for matchId: ${data.matchId}`);
          const h2hResponse = await getHeadToHead(data.matchId);
          
          if (h2hResponse?.matches && Array.isArray(h2hResponse.matches)) {
            // Convert API H2H matches to our format
            h2hFilteredMatches = h2hResponse.matches.map((m: any) => ({
              id: m.id,
              utcDate: m.utcDate,
              status: m.status,
              matchday: m.matchday || 0,
              homeTeam: {
                id: m.homeTeam?.id || 0,
                name: m.homeTeam?.name || 'Unknown',
                shortName: m.homeTeam?.shortName || m.homeTeam?.name || 'Unknown',
                tla: m.homeTeam?.tla || '',
                crest: m.homeTeam?.crest || '',
              },
              awayTeam: {
                id: m.awayTeam?.id || 0,
                name: m.awayTeam?.name || 'Unknown',
                shortName: m.awayTeam?.shortName || m.awayTeam?.name || 'Unknown',
                tla: m.awayTeam?.tla || '',
                crest: m.awayTeam?.crest || '',
              },
              score: {
                winner: m.score?.winner || null,
                fullTime: { 
                  home: m.score?.fullTime?.home ?? null, 
                  away: m.score?.fullTime?.away ?? null 
                },
                halfTime: { 
                  home: m.score?.halfTime?.home ?? null, 
                  away: m.score?.halfTime?.away ?? null 
                },
              },
              competition: {
                id: m.competition?.id || 0,
                code: m.competition?.code || competitionCode,
                name: m.competition?.name || '',
                emblem: m.competition?.emblem || '',
                area: m.area || { id: 0, name: '', code: '', flag: '' },
              },
            }));
            console.log(`[useMatchAnalysis] Got ${h2hFilteredMatches.length} H2H matches from API`);
          }
        } catch (h2hError) {
          console.warn('[useMatchAnalysis] H2H API call failed, falling back to cached data:', h2hError);
        }
      }
      
      // Fallback: Filter H2H from cached finished matches if API didn't return data
      if (h2hFilteredMatches.length === 0) {
        h2hFilteredMatches = recentMatches.filter(match => {
          const teams = [match.homeTeam.id, match.awayTeam.id];
          return teams.includes(homeStanding.team.id) && teams.includes(awayStanding.team.id);
        });
        console.log(`[useMatchAnalysis] Using ${h2hFilteredMatches.length} H2H matches from cache`);
      }

      // Son maçları filtrele - using recent data
      const homeRecentMatches = recentMatches
        .filter(m => m.homeTeam.id === homeStanding.team.id || m.awayTeam.id === homeStanding.team.id)
        .slice(0, 5);

      const awayRecentMatches = recentMatches
        .filter(m => m.homeTeam.id === awayStanding.team.id || m.awayTeam.id === awayStanding.team.id)
        .slice(0, 5);

      // === ADVANCED FEATURES (Poisson hesaplamaları - generatePrediction'dan önce lazım) ===
      
      // Lig ortalamaları - veritabanından ev/deplasman ayrımlı çek
      let leagueAvgHomeGoals = 1.5;
      let leagueAvgAwayGoals = 1.1;
      let leagueOver25Pct: number | undefined;
      
      try {
        const { data: leagueAvg } = await supabase
          .from('league_averages')
          .select('avg_home_goals, avg_away_goals, over_2_5_percentage')
          .eq('league', competitionCode)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (leagueAvg) {
          if (leagueAvg.avg_home_goals) leagueAvgHomeGoals = Number(leagueAvg.avg_home_goals);
          if (leagueAvg.avg_away_goals) leagueAvgAwayGoals = Number(leagueAvg.avg_away_goals);
          if (leagueAvg.over_2_5_percentage) leagueOver25Pct = Number(leagueAvg.over_2_5_percentage);
        }
      } catch (e) { console.warn('[useMatchAnalysis] League avg fetch failed:', e); }

      const leagueAvgScored = (leagueAvgHomeGoals + leagueAvgAwayGoals) / 2;
      const leagueAvgConceded = leagueAvgScored;

      // Poisson hesaplamaları
      const homeAttackStrength = (homeStanding.goalsFor / homeStanding.playedGames) / leagueAvgScored;
      const homeDefenseStrength = (homeStanding.goalsAgainst / homeStanding.playedGames) / leagueAvgConceded;
      const awayAttackStrength = (awayStanding.goalsFor / awayStanding.playedGames) / leagueAvgScored;
      const awayDefenseStrength = (awayStanding.goalsAgainst / awayStanding.playedGames) / leagueAvgConceded;

      const expectedGoals = calculatePoissonExpectedGoals(
        homeAttackStrength,
        homeDefenseStrength,
        awayAttackStrength,
        awayDefenseStrength,
        leagueAvgHomeGoals,
        leagueAvgAwayGoals
      );

      const scoreProbabilities = generateScoreProbabilities(
        expectedGoals.homeExpected,
        expectedGoals.awayExpected
      );

      const rawGoalLines = calcGoalLines(scoreProbabilities);
      const bttsProbability = calculateBTTSProbability(scoreProbabilities);
      const matchResultProbs = calculateMatchResultProbabilities(scoreProbabilities);
      const mostLikelyScores = getMostLikelyScores(scoreProbabilities, 1);

      const poissonOver25Prob = rawGoalLines.over2_5 / 100; // 0-1 range
      
      // İlk yarı beklenen golleri (%42 kuralı)
      const poissonFirstHalfHome = expectedGoals.homeExpected * 0.42;
      const poissonFirstHalfAway = expectedGoals.awayExpected * 0.42;

      // Matematiksel tahmin motorunu çalıştır (Poisson verileriyle)
      const mathResult = generatePrediction({
        homeTeam: {
          standing: homeStanding,
          recentMatches: homeRecentMatches,
        },
        awayTeam: {
          standing: awayStanding,
          recentMatches: awayRecentMatches,
        },
        h2hMatches: h2hFilteredMatches,
        league: data.league,
        matchDate: data.matchDate,
        poissonOver25Prob,
        leagueOver25Pct,
        poissonHomeWinProb: matchResultProbs.homeWin,
        poissonDrawProb: matchResultProbs.draw,
        poissonAwayWinProb: matchResultProbs.awayWin,
        poissonBttsProb: bttsProbability,
        poissonMostLikelyScore: mostLikelyScores.length > 0 
          ? { home: mostLikelyScores[0].homeGoals, away: mostLikelyScores[0].awayGoals }
          : undefined,
        poissonFirstHalfHome,
        poissonFirstHalfAway,
      });

      // Feature'ları çıkar
      const features = extractMatchFeatures(homeStanding, awayStanding, mathResult.headToHead);

      // Convert to our type format
      const goalLineProbabilities: GoalLineProbabilities = {
        over05: rawGoalLines.over0_5 / 100,
        over15: rawGoalLines.over1_5 / 100,
        over25: rawGoalLines.over2_5 / 100,
        over35: rawGoalLines.over3_5 / 100,
        under05: rawGoalLines.under0_5 / 100,
        under15: rawGoalLines.under1_5 / 100,
        under25: rawGoalLines.under2_5 / 100,
        under35: rawGoalLines.under3_5 / 100,
      };

      const poissonData: PoissonData = {
        scoreProbabilities: scoreProbabilities.map(sp => ({
          homeGoals: sp.homeGoals,
          awayGoals: sp.awayGoals,
          probability: sp.probability / 100,
        })),
        goalLineProbabilities,
        bttsProbability: bttsProbability / 100,
        expectedHomeGoals: expectedGoals.homeExpected,
        expectedAwayGoals: expectedGoals.awayExpected,
      };

      // Power indexes
      const homePowerIndexes = calculatePowerIndexes(
        homeStanding.goalsFor,
        homeStanding.goalsAgainst,
        homeStanding.playedGames,
        leagueAvgScored,
        leagueAvgConceded
      );

      const awayPowerIndexes = calculatePowerIndexes(
        awayStanding.goalsFor,
        awayStanding.goalsAgainst,
        awayStanding.playedGames,
        leagueAvgScored,
        leagueAvgConceded
      );

      const homePower: TeamPower = {
        attackIndex: homePowerIndexes.attackStrength * 100,
        defenseIndex: (2 - homePowerIndexes.defenseStrength) * 100,
        overallPower: homePowerIndexes.overallPower * 100,
        formScore: calculateFormScore(homeStanding.form),
      };

      const awayPower: TeamPower = {
        attackIndex: awayPowerIndexes.attackStrength * 100,
        defenseIndex: (2 - awayPowerIndexes.defenseStrength) * 100,
        overallPower: awayPowerIndexes.overallPower * 100,
        formScore: calculateFormScore(awayStanding.form),
      };

      // Context analysis
      const isDerby = isDerbyMatch(data.homeTeam, data.awayTeam, data.league);
      const matchContext = calculateMatchImportance(homeStanding, awayStanding, data.league, homeStanding.playedGames);

      const context: MatchContext = {
        matchImportance: matchContext.matchImportance as 'critical' | 'high' | 'medium' | 'low',
        seasonPhase: matchContext.seasonPhase as 'early' | 'mid' | 'late' | 'final',
        isDerby,
        homeMomentum: calculateMomentum(homeStanding.form),
        awayMomentum: calculateMomentum(awayStanding.form),
        contextTags: matchContext.contextTags,
      };

      // Match insights
      const insights: MatchInsights = {
        homeFormScore: homePower.formScore,
        awayFormScore: awayPower.formScore,
        homeMomentum: context.homeMomentum,
        awayMomentum: context.awayMomentum,
        isDerby,
        matchImportance: context.matchImportance,
        homeCleanSheetRatio: calculateCleanSheetRatio(homeStanding.goalsAgainst, homeStanding.playedGames),
        awayCleanSheetRatio: calculateCleanSheetRatio(awayStanding.goalsAgainst, awayStanding.playedGames),
        homeAttackIndex: homePower.attackIndex,
        awayAttackIndex: awayPower.attackIndex,
      };

      // AI tahminlerini al
      let finalPredictions: Prediction[] = mathResult.predictions;
      let isAIEnhanced = false;

      try {
        const mlResult = await getMLPrediction(
          features.homeTeam,
          features.awayTeam,
          features.h2h,
          data.league,
          {
            over25Prob: rawGoalLines.over2_5,
            leagueOver25Pct,
            homeExpected: expectedGoals.homeExpected,
            awayExpected: expectedGoals.awayExpected,
          }
        );

        if (mlResult?.success && mlResult.predictions) {
          isAIEnhanced = true;
          const ai = mlResult.predictions;
          
          // Hibrit tahminler oluştur
          finalPredictions = [
            {
              type: 'Maç Sonucu',
              prediction: convertAIResultToDisplay(ai.matchResult.prediction, homeStanding.team.name, awayStanding.team.name),
              confidence: calculateHybridConfidence(
                ai.matchResult.confidence,
                mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Maç Sonucu')?.confidence || 'orta'),
                dynamicWeights
              ),
              reasoning: ai.matchResult.reasoning,
              isAIPowered: true,
              aiConfidence: ai.matchResult.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Maç Sonucu')?.confidence || 'orta'),
            },
            {
              type: 'Toplam Gol Alt/Üst',
              prediction: convertGoalsPrediction(ai.totalGoals.prediction),
              confidence: (() => {
                const poissonProb = rawGoalLines.over2_5 / 100;
                const isBorderZone = poissonProb >= 0.45 && poissonProb <= 0.55;
                const mathPred = mathResult.predictions.find(p => p.type === 'Toplam Gol Alt/Üst');
                const aiDirection = ai.totalGoals.prediction === 'OVER_2_5' ? 'Üst' : 'Alt';
                const mathDirection = mathPred?.prediction?.includes('Üst') ? 'Üst' : 'Alt';
                
                if (isBorderZone) {
                  // Sınır bölgede güveni düşür
                  return 'düşük' as const;
                }
                if (aiDirection !== mathDirection) {
                  // AI ve matematik ters yönde - Poisson'a öncelik ver, güveni düşür
                  return 'düşük' as const;
                }
                return calculateHybridConfidence(
                  ai.totalGoals.confidence,
                  mathConfidenceToNumber(mathPred?.confidence || 'orta'),
                  dynamicWeights
                );
              })(),
              reasoning: ai.totalGoals.reasoning,
              isAIPowered: true,
              aiConfidence: ai.totalGoals.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Toplam Gol Alt/Üst')?.confidence || 'orta'),
            },
            {
              type: 'Karşılıklı Gol',
              prediction: convertBTTSPrediction(ai.bothTeamsScore.prediction),
              confidence: calculateHybridConfidence(
                ai.bothTeamsScore.confidence,
                mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta'),
                dynamicWeights
              ),
              reasoning: ai.bothTeamsScore.reasoning,
              isAIPowered: true,
              aiConfidence: ai.bothTeamsScore.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta'),
            },
            {
              type: 'Doğru Skor',
              prediction: ai.correctScore.prediction,
              confidence: aiConfidenceToString(ai.correctScore.confidence),
              reasoning: ai.correctScore.reasoning,
              isAIPowered: true,
              aiConfidence: ai.correctScore.confidence,
              mathConfidence: 0.3, // Doğru skor her zaman düşük güven
            },
            {
              type: 'İlk Yarı Sonucu',
              prediction: convertAIResultToDisplay(ai.firstHalf.prediction, homeStanding.team.name, awayStanding.team.name),
              confidence: calculateHybridConfidence(
                ai.firstHalf.confidence,
                mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta'),
                dynamicWeights
              ),
              reasoning: ai.firstHalf.reasoning,
              isAIPowered: true,
              aiConfidence: ai.firstHalf.confidence,
              mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta'),
            },
          ];

          sonnerToast('AI analizi hazır ✓', { duration: 1500 });
        }
      } catch (aiError) {
        console.error('AI prediction error (falling back to math):', aiError);
        // AI hatası durumunda matematiksel tahminlerle devam et
      }

      const result: MatchAnalysis = {
        ...mathResult,
        input: {
          ...mathResult.input,
          homeTeamCrest: homeStanding.team.crest,
          awayTeamCrest: awayStanding.team.crest,
        },
        predictions: finalPredictions,
        isAIEnhanced,
        // Advanced data
        insights,
        context,
        homePower,
        awayPower,
        poissonData,
      };

      setAnalysis(result);
      
      // Tahminleri veritabanına kaydet ve feature'ları logla
      try {
        const predictionId = await savePredictions(
          data.league,
          result.input.homeTeam,
          result.input.awayTeam,
          data.matchDate,
          result.predictions,
          user?.id
        );
        
        // ML öğrenme döngüsü için feature'ları kaydet
        if (predictionId) {
          const aiConf = result.predictions[0]?.aiConfidence || 0.5;
          const mathConf = result.predictions[0]?.mathConfidence || 0.5;
          const featureRecord = createFeatureRecord(
            features,
            aiConf,
            result.predictions[0]?.reasoning || '',
            mathConf,
            { homeExpected: expectedGoals.homeExpected, awayExpected: expectedGoals.awayExpected }
          );
          
          // Add AI and Math prediction values for separate tracking
          const primaryPred = result.predictions[0];
          if (primaryPred && isAIEnhanced) {
            (featureRecord as any).ai_prediction_value = primaryPred.prediction;
            const mathPred = mathResult.predictions.find(p => p.type === primaryPred.type);
            if (mathPred) {
              (featureRecord as any).math_prediction_value = mathPred.prediction;
            }
          }
          
          await savePredictionFeatures(predictionId, featureRecord);
          console.log('[ML] Prediction features saved for learning loop');
        }
      } catch (saveError) {
        console.error('Error saving predictions:', saveError);
      }
      
      if (!isAIEnhanced) {
        sonnerToast('Analiz hazır ✓', { duration: 1500 });
      }

      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      
      toast({
        title: 'API Hatası',
        description: 'Gerçek veriler alınamadı, mock veri kullanılıyor.',
        variant: 'destructive',
      });

      // Fallback to mock data
      const mockAnalysis = generateMockPrediction(
        data.homeTeam,
        data.awayTeam,
        data.league,
        data.matchDate
      );
      setAnalysis(mockAnalysis);
      return mockAnalysis;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
  };

  return {
    analysis,
    isLoading,
    analyzeMatch,
    clearAnalysis,
  };
}
