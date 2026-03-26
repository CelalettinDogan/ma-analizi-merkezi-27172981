import { toast as sonnerToast } from 'sonner';
import { MatchInput, MatchAnalysis, Prediction, MatchInsights, MatchContext, TeamPower, PoissonData, GoalLineProbabilities } from '@/types/match';
import { supabase } from '@/integrations/supabase/client';
import { CompetitionCode, Standing, SUPPORTED_COMPETITIONS } from '@/types/footballApi';
import { getStandings, getFinishedMatches, getHeadToHead } from '@/services/footballApiService';
import { generatePrediction, generateMockPrediction } from '@/utils/predictionEngine';
import { savePredictions } from '@/services/predictionService';
import { extractMatchFeatures, createFeatureRecord } from '@/utils/featureExtractor';
import { 
  getMLPrediction, 
  aiConfidenceToString, 
  convertAIResultToDisplay, 
  convertGoalsPrediction, 
  convertBTTSPrediction,
  savePredictionFeatures,
  getAIMathWeights
} from '@/services/mlPredictionService';
import { getAllMLInferences, type MLFeatures } from '@/services/mlInferenceService';
import { calculatePoissonExpectedGoals, generateScoreProbabilities, calculateMatchResultProbabilities, calculateGoalLineProbabilities as calcGoalLines, calculateBTTSProbability, calculatePowerIndexes, getMostLikelyScores } from '@/utils/poissonCalculator';
import { calculateMatchImportance, calculateMomentum, calculateCleanSheetRatio } from '@/utils/contextAnalyzer';
import { isDerbyMatch } from '@/utils/derbyDetector';
import { enrichPredictionsWithMarketScores, type MarketReliabilityData } from '@/utils/marketScoring';
import { calculateHybridConfidence, mathConfidenceToNumber, calculateFormScore } from './helpers';
import { runLimitedAnalysis } from './runLimitedAnalysis';

interface RunFullAnalysisOptions {
  data: MatchInput;
  userId?: string;
  toastFn: (opts: { title: string; description: string; variant?: string }) => void;
}

export async function runFullAnalysis({ data, userId, toastFn }: RunFullAnalysisOptions): Promise<MatchAnalysis> {
  const predictionTypes = ['Maç Sonucu', 'Toplam Gol Alt/Üst', 'Karşılıklı Gol', 'İlk Yarı Sonucu'];
  const perTypeWeights: Record<string, { aiWeight: number; mathWeight: number } | null> = {};

  // Lig kodunu bul
  const competition = SUPPORTED_COMPETITIONS.find(
    c => c.name === data.league || c.code === data.league
  );

  if (!competition) {
    return generateMockPrediction(data.homeTeam, data.awayTeam, data.league, data.matchDate);
  }

  const competitionCode = competition.code as CompetitionCode;
  const isCL = competitionCode === 'CL';
  const domesticLeagues: CompetitionCode[] = ['PL', 'BL1', 'PD', 'SA', 'FL1'];

  // Paralel olarak verileri + weights'i çek
  const weightsPromise = Promise.all(predictionTypes.map(type => getAIMathWeights(type)))
    .then(results => {
      predictionTypes.forEach((type, i) => {
        perTypeWeights[type] = results[i];
        if (results[i]) {
          console.log(`[useMatchAnalysis] ${type} weights: AI=${(results[i]!.aiWeight * 100).toFixed(1)}%, Math=${(results[i]!.mathWeight * 100).toFixed(1)}%`);
        }
      });
    })
    .catch(e => console.warn('[useMatchAnalysis] Failed to fetch dynamic weights:', e));

  let standings: Standing[] = [];
  let recentMatches: any[] = [];

  if (isCL) {
    const allResults = await Promise.all([
      ...domesticLeagues.map(league => 
        Promise.all([getStandings(league), getFinishedMatches(league, 90)])
      ),
      weightsPromise,
    ]);
    for (let i = 0; i < domesticLeagues.length; i++) {
      const [leagueStandings, leagueMatches] = allResults[i] as [Standing[], any[]];
      standings = [...standings, ...leagueStandings];
      recentMatches = [...recentMatches, ...leagueMatches];
    }
  } else {
    const [standingsResult, matchesResult] = await Promise.all([
      getStandings(competitionCode),
      getFinishedMatches(competitionCode, 90),
      weightsPromise,
    ]);
    standings = standingsResult;
    recentMatches = matchesResult;
  }

  // Takımları bul
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

  if (!homeStanding || !awayStanding) {
    if (isCL) {
      console.log('[useMatchAnalysis] CL limited analysis mode');
      return runLimitedAnalysis(data, homeStanding, awayStanding, userId, toastFn);
    }

    toastFn({
      title: 'Takım Bulunamadı',
      description: 'Girilen takım isimleri puan durumunda bulunamadı. Mock veri kullanılıyor.',
      variant: 'destructive',
    });
    return generateMockPrediction(data.homeTeam, data.awayTeam, data.league, data.matchDate);
  }

  // H2H
  let h2hFilteredMatches: typeof recentMatches = [];
  if (data.matchId) {
    try {
      const h2hResponse = await getHeadToHead(data.matchId);
      if (h2hResponse?.matches && Array.isArray(h2hResponse.matches)) {
        h2hFilteredMatches = h2hResponse.matches.map((m: any) => ({
          id: m.id, utcDate: m.utcDate, status: m.status, matchday: m.matchday || 0,
          homeTeam: { id: m.homeTeam?.id || 0, name: m.homeTeam?.name || 'Unknown', shortName: m.homeTeam?.shortName || m.homeTeam?.name || 'Unknown', tla: m.homeTeam?.tla || '', crest: m.homeTeam?.crest || '' },
          awayTeam: { id: m.awayTeam?.id || 0, name: m.awayTeam?.name || 'Unknown', shortName: m.awayTeam?.shortName || m.awayTeam?.name || 'Unknown', tla: m.awayTeam?.tla || '', crest: m.awayTeam?.crest || '' },
          score: { winner: m.score?.winner || null, fullTime: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null }, halfTime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null } },
          competition: { id: m.competition?.id || 0, code: m.competition?.code || competitionCode, name: m.competition?.name || '', emblem: m.competition?.emblem || '', area: m.area || { id: 0, name: '', code: '', flag: '' } },
        }));
      }
    } catch (h2hError) {
      console.warn('[useMatchAnalysis] H2H API call failed:', h2hError);
    }
  }

  if (h2hFilteredMatches.length === 0) {
    h2hFilteredMatches = recentMatches.filter(match => {
      const teams = [match.homeTeam.id, match.awayTeam.id];
      return teams.includes(homeStanding.team.id) && teams.includes(awayStanding.team.id);
    });
  }

  const homeRecentMatches = recentMatches
    .filter(m => m.homeTeam.id === homeStanding.team.id || m.awayTeam.id === homeStanding.team.id)
    .slice(0, 5);
  const awayRecentMatches = recentMatches
    .filter(m => m.homeTeam.id === awayStanding.team.id || m.awayTeam.id === awayStanding.team.id)
    .slice(0, 5);

  // Lig ortalamaları
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

  // Poisson
  const homeAttackStrength = (homeStanding.goalsFor / homeStanding.playedGames) / leagueAvgScored;
  const homeDefenseStrength = (homeStanding.goalsAgainst / homeStanding.playedGames) / leagueAvgConceded;
  const awayAttackStrength = (awayStanding.goalsFor / awayStanding.playedGames) / leagueAvgScored;
  const awayDefenseStrength = (awayStanding.goalsAgainst / awayStanding.playedGames) / leagueAvgConceded;

  const expectedGoals = calculatePoissonExpectedGoals(homeAttackStrength, homeDefenseStrength, awayAttackStrength, awayDefenseStrength, leagueAvgHomeGoals, leagueAvgAwayGoals);
  const scoreProbabilities = generateScoreProbabilities(expectedGoals.homeExpected, expectedGoals.awayExpected);
  const rawGoalLines = calcGoalLines(scoreProbabilities);
  const bttsProbability = calculateBTTSProbability(scoreProbabilities);
  const matchResultProbs = calculateMatchResultProbabilities(scoreProbabilities);
  const mostLikelyScores = getMostLikelyScores(scoreProbabilities, 1);

  const poissonOver25Prob = rawGoalLines.over2_5 / 100;
  const poissonFirstHalfHome = expectedGoals.homeExpected * 0.42;
  const poissonFirstHalfAway = expectedGoals.awayExpected * 0.42;

  // Matematiksel tahmin
  const mathResult = generatePrediction({
    homeTeam: { standing: homeStanding, recentMatches: homeRecentMatches },
    awayTeam: { standing: awayStanding, recentMatches: awayRecentMatches },
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

  const features = extractMatchFeatures(homeStanding, awayStanding, mathResult.headToHead);

  const goalLineProbabilities: GoalLineProbabilities = {
    over05: rawGoalLines.over0_5 / 100, over15: rawGoalLines.over1_5 / 100,
    over25: rawGoalLines.over2_5 / 100, over35: rawGoalLines.over3_5 / 100,
    under05: rawGoalLines.under0_5 / 100, under15: rawGoalLines.under1_5 / 100,
    under25: rawGoalLines.under2_5 / 100, under35: rawGoalLines.under3_5 / 100,
  };

  const poissonData: PoissonData = {
    scoreProbabilities: scoreProbabilities.map(sp => ({ homeGoals: sp.homeGoals, awayGoals: sp.awayGoals, probability: sp.probability / 100 })),
    goalLineProbabilities,
    bttsProbability: bttsProbability / 100,
    expectedHomeGoals: expectedGoals.homeExpected,
    expectedAwayGoals: expectedGoals.awayExpected,
  };

  // Power indexes
  const homePowerIndexes = calculatePowerIndexes(homeStanding.goalsFor, homeStanding.goalsAgainst, homeStanding.playedGames, leagueAvgScored, leagueAvgConceded);
  const awayPowerIndexes = calculatePowerIndexes(awayStanding.goalsFor, awayStanding.goalsAgainst, awayStanding.playedGames, leagueAvgScored, leagueAvgConceded);

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

  // Context
  const isDerby = isDerbyMatch(data.homeTeam, data.awayTeam, data.league);
  const matchContext = calculateMatchImportance(homeStanding, awayStanding, data.league, homeStanding.playedGames);
  const context: MatchContext = {
    matchImportance: matchContext.matchImportance as any,
    seasonPhase: matchContext.seasonPhase as any,
    isDerby,
    homeMomentum: calculateMomentum(homeStanding.form),
    awayMomentum: calculateMomentum(awayStanding.form),
    contextTags: matchContext.contextTags,
  };

  const insights: MatchInsights = {
    homeFormScore: homePower.formScore, awayFormScore: awayPower.formScore,
    homeMomentum: context.homeMomentum, awayMomentum: context.awayMomentum,
    isDerby, matchImportance: context.matchImportance,
    homeCleanSheetRatio: calculateCleanSheetRatio(homeStanding.goalsAgainst, homeStanding.playedGames),
    awayCleanSheetRatio: calculateCleanSheetRatio(awayStanding.goalsAgainst, awayStanding.playedGames),
    homeAttackIndex: homePower.attackIndex, awayAttackIndex: awayPower.attackIndex,
  };

  // ML features
  const mlFeatures: MLFeatures = {
    home_form_score: calculateFormScore(homeStanding.form),
    away_form_score: calculateFormScore(awayStanding.form),
    home_goal_avg: homeStanding.goalsFor / homeStanding.playedGames,
    away_goal_avg: awayStanding.goalsFor / awayStanding.playedGames,
    position_diff: homeStanding.position - awayStanding.position,
    home_advantage_score: homeStanding.position <= 6 ? 70 : homeStanding.position <= 12 ? 50 : 30,
    h2h_home_wins: features.h2h.homeWins,
    h2h_away_wins: features.h2h.awayWins,
    expected_goals: expectedGoals.homeExpected + expectedGoals.awayExpected,
    home_attack_index: homeAttackStrength,
    home_defense_index: homeDefenseStrength,
    away_attack_index: awayAttackStrength,
    away_defense_index: awayDefenseStrength,
    home_momentum: calculateMomentum(homeStanding.form) || 0,
    away_momentum: calculateMomentum(awayStanding.form) || 0,
    poisson_home_expected: expectedGoals.homeExpected,
    poisson_away_expected: expectedGoals.awayExpected,
  };

  // AI + ML paralel
  let finalPredictions: Prediction[] = mathResult.predictions;
  let isAIEnhanced = false;

  try {
    const [mlResult, mlInferenceResults] = await Promise.all([
      getMLPrediction(features.homeTeam, features.awayTeam, features.h2h, data.league, {
        over25Prob: rawGoalLines.over2_5,
        leagueOver25Pct,
        homeExpected: expectedGoals.homeExpected,
        awayExpected: expectedGoals.awayExpected,
      }),
      getAllMLInferences(mlFeatures),
    ]);

    const mlInferences = mlInferenceResults;
    if (Object.keys(mlInferences).length > 0) {
      console.log('[useMatchAnalysis] ML inference results:', Object.entries(mlInferences).map(([k, v]) => `${k}: ${((v as any).probability * 100).toFixed(1)}%`).join(', '));
    }

    if (mlResult?.success && mlResult.predictions) {
      isAIEnhanced = true;
      const ai = mlResult.predictions;
      
      const getMLConf = (type: string): number | null => {
        const ml = mlInferences[type];
        return ml ? (ml as any).confidence : null;
      };
      
      finalPredictions = [
        {
          type: 'Maç Sonucu',
          prediction: convertAIResultToDisplay(ai.matchResult.prediction, homeStanding.team.name, awayStanding.team.name),
          confidence: calculateHybridConfidence(ai.matchResult.confidence, mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Maç Sonucu')?.confidence || 'orta'), perTypeWeights['Maç Sonucu'], getMLConf('Maç Sonucu')),
          reasoning: ai.matchResult.reasoning, isAIPowered: true,
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
            if (isBorderZone) return 'düşük' as const;
            if (aiDirection !== mathDirection) return 'düşük' as const;
            return calculateHybridConfidence(ai.totalGoals.confidence, mathConfidenceToNumber(mathPred?.confidence || 'orta'), perTypeWeights['Toplam Gol Alt/Üst'], getMLConf('Toplam Gol Alt/Üst'));
          })(),
          reasoning: ai.totalGoals.reasoning, isAIPowered: true,
          aiConfidence: ai.totalGoals.confidence,
          mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Toplam Gol Alt/Üst')?.confidence || 'orta'),
        },
        {
          type: 'Karşılıklı Gol',
          prediction: convertBTTSPrediction(ai.bothTeamsScore.prediction),
          confidence: calculateHybridConfidence(ai.bothTeamsScore.confidence, mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta'), perTypeWeights['Karşılıklı Gol'], getMLConf('Karşılıklı Gol')),
          reasoning: ai.bothTeamsScore.reasoning, isAIPowered: true,
          aiConfidence: ai.bothTeamsScore.confidence,
          mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'Karşılıklı Gol')?.confidence || 'orta'),
        },
        {
          type: 'Doğru Skor',
          prediction: ai.correctScore.prediction,
          confidence: aiConfidenceToString(ai.correctScore.confidence),
          reasoning: ai.correctScore.reasoning, isAIPowered: true,
          aiConfidence: ai.correctScore.confidence, mathConfidence: 0.3,
        },
        {
          type: 'İlk Yarı Sonucu',
          prediction: convertAIResultToDisplay(ai.firstHalf.prediction, homeStanding.team.name, awayStanding.team.name),
          confidence: calculateHybridConfidence(ai.firstHalf.confidence, mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta'), perTypeWeights['İlk Yarı Sonucu'], getMLConf('İlk Yarı Sonucu')),
          reasoning: ai.firstHalf.reasoning, isAIPowered: true,
          aiConfidence: ai.firstHalf.confidence,
          mathConfidence: mathConfidenceToNumber(mathResult.predictions.find(p => p.type === 'İlk Yarı Sonucu')?.confidence || 'orta'),
        },
      ];

      sonnerToast('AI + ML analizi hazır ✓', { duration: 1500 });
    }
  } catch (aiError) {
    console.error('AI prediction error (falling back to math):', aiError);
  }

  // Market scoring
  let marketScoredPredictions = finalPredictions;
  try {
    const { data: mlStats } = await supabase
      .from('ml_model_stats')
      .select('prediction_type, accuracy_percentage, total_predictions');
    
    const historicalData: MarketReliabilityData[] = (mlStats || []).map((s: any) => ({
      predictionType: s.prediction_type,
      accuracyPercentage: s.accuracy_percentage ? Number(s.accuracy_percentage) : null,
      totalPredictions: s.total_predictions ? Number(s.total_predictions) : null,
    }));
    
    marketScoredPredictions = enrichPredictionsWithMarketScores(finalPredictions, mathResult.predictions, historicalData);
    
    const recommended = marketScoredPredictions.find(p => p.isRecommended);
    if (recommended) {
      console.log(`[useMatchAnalysis] Best market: ${recommended.type} (FMS: ${recommended.marketScore}, risk: ${recommended.riskLevel})`);
    }
  } catch (e) {
    console.warn('[useMatchAnalysis] Market scoring failed:', e);
  }

  const result: MatchAnalysis = {
    ...mathResult,
    input: { ...mathResult.input, homeTeamCrest: homeStanding.team.crest, awayTeamCrest: awayStanding.team.crest },
    predictions: marketScoredPredictions,
    isAIEnhanced,
    insights, context, homePower, awayPower, poissonData,
  };

  // Fire-and-forget DB save
  savePredictions(data.league, result.input.homeTeam, result.input.awayTeam, data.matchDate, result.predictions, userId)
    .then(predictionId => {
      if (predictionId) {
        const aiConf = result.predictions[0]?.aiConfidence || 0.5;
        const mathConf = result.predictions[0]?.mathConfidence || 0.5;
        const featureRecord = createFeatureRecord(features, aiConf, result.predictions[0]?.reasoning || '', mathConf, { homeExpected: expectedGoals.homeExpected, awayExpected: expectedGoals.awayExpected });
        
        const primaryPred = result.predictions[0];
        if (primaryPred && isAIEnhanced) {
          (featureRecord as any).ai_prediction_value = primaryPred.prediction;
          const mathPred = mathResult.predictions.find(p => p.type === primaryPred.type);
          if (mathPred) (featureRecord as any).math_prediction_value = mathPred.prediction;
        }
        
        savePredictionFeatures(predictionId, featureRecord).catch(e => console.error('Error saving features:', e));
      }
    })
    .catch(e => console.error('Error saving predictions:', e));
  
  if (!isAIEnhanced) {
    sonnerToast('Analiz hazır ✓', { duration: 1500 });
  }

  return result;
}
