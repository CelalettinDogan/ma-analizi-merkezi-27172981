import { MatchInput, MatchAnalysis, Prediction, MatchInsights, MatchContext, TeamPower, PoissonData, GoalLineProbabilities } from '@/types/match';
import { Standing } from '@/types/footballApi';
import { getHeadToHead } from '@/services/footballApiService';
import { generatePrediction } from '@/utils/predictionEngine';
import { savePredictions } from '@/services/predictionService';
import { extractMatchFeatures, createFeatureRecord } from '@/utils/featureExtractor';
import { 
  getMLPrediction, 
  aiConfidenceToString, 
  convertAIResultToDisplay, 
  convertGoalsPrediction, 
  convertBTTSPrediction,
  savePredictionFeatures
} from '@/services/mlPredictionService';
import { calculatePoissonExpectedGoals, generateScoreProbabilities, calculateGoalLineProbabilities as calcGoalLines, calculateBTTSProbability, calculatePowerIndexes } from '@/utils/poissonCalculator';
import { calculateMomentum, calculateCleanSheetRatio } from '@/utils/contextAnalyzer';
import { isDerbyMatch } from '@/utils/derbyDetector';
import { calculateHybridConfidence, mathConfidenceToNumber, calculateFormScore } from './helpers';

export async function runLimitedAnalysis(
  data: MatchInput,
  homeStanding: Standing | undefined,
  awayStanding: Standing | undefined,
  userId?: string,
  toastFn?: (opts: { title: string; description: string }) => void
): Promise<MatchAnalysis> {
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

  const mathResult = generatePrediction({
    homeTeam: { standing: effectiveHome, recentMatches: [] },
    awayTeam: { standing: effectiveAway, recentMatches: [] },
    h2hMatches: h2hFilteredMatches,
    league: data.league,
    matchDate: data.matchDate,
  });

  const features = extractMatchFeatures(effectiveHome, effectiveAway, mathResult.headToHead);

  // Poisson
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
  toastFn?.({
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
    const predictionId = await savePredictions(data.league, result.input.homeTeam, result.input.awayTeam, data.matchDate, result.predictions, userId);
    if (predictionId) {
      const aiConf = result.predictions[0]?.aiConfidence || 0.5;
      const mathConf = result.predictions[0]?.mathConfidence || 0.5;
      const featureRecord = createFeatureRecord(features, aiConf, result.predictions[0]?.reasoning || '', mathConf, { homeExpected: expectedGoals.homeExpected, awayExpected: expectedGoals.awayExpected });
      await savePredictionFeatures(predictionId, featureRecord);
    }
  } catch (saveError) { console.error('[limitedAnalysis] Save error:', saveError); }

  return result;
}
