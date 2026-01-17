import { supabase } from '@/integrations/supabase/client';
import { Prediction } from '@/types/match';
import { PredictionRecord, PredictionStats, OverallStats } from '@/types/prediction';
import { PREDICTION_TYPES } from '@/constants/predictions';

// Confidence threshold for premium predictions (70%)
const PREMIUM_CONFIDENCE_THRESHOLD = 0.70;

// Calculate hybrid confidence from AI and Math confidence
function calculateHybridConfidence(prediction: Prediction): number {
  const ai = prediction.aiConfidence || 0;
  const math = prediction.mathConfidence || 0;
  return (ai + math) / 2;
}

export async function savePredictions(
  league: string,
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  predictions: Prediction[],
  userId?: string
): Promise<void> {
  const records = predictions.map(p => {
    const hybridConfidence = calculateHybridConfidence(p);
    const isPremium = hybridConfidence >= PREMIUM_CONFIDENCE_THRESHOLD;
    
    return {
      league,
      home_team: homeTeam,
      away_team: awayTeam,
      match_date: matchDate,
      prediction_type: p.type,
      prediction_value: p.prediction,
      confidence: p.confidence,
      reasoning: p.reasoning,
      user_id: userId || null,
      hybrid_confidence: hybridConfidence,
      is_premium: isPremium,
    };
  });

  const { error } = await supabase
    .from('predictions')
    .insert(records);

  if (error) {
    console.error('Error saving predictions:', error);
    throw error;
  }
}

export async function getRecentPredictions(limit: number = 20): Promise<PredictionRecord[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching predictions:', error);
    throw error;
  }

  return data as PredictionRecord[];
}

export async function getPredictionStats(): Promise<PredictionStats[]> {
  const { data, error } = await supabase
    .from('prediction_stats')
    .select('*');

  if (error) {
    console.error('Error fetching prediction stats:', error);
    throw error;
  }

  return data as PredictionStats[];
}

export async function getOverallStats(): Promise<OverallStats | null> {
  const { data, error } = await supabase
    .from('overall_stats')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching overall stats:', error);
    return null;
  }

  return data as OverallStats;
}

export async function verifyPrediction(
  id: string,
  homeScore: number,
  awayScore: number,
  firstHalfHomeScore?: number,
  firstHalfAwayScore?: number
): Promise<void> {
  // First get the prediction to determine if it was correct
  const { data: prediction, error: fetchError } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !prediction) {
    throw new Error('Prediction not found');
  }

  const actualResult = `${homeScore}-${awayScore}`;
  const isCorrect = checkPredictionCorrect(
    prediction.prediction_type,
    prediction.prediction_value,
    homeScore,
    awayScore,
    prediction.home_team,
    prediction.away_team,
    firstHalfHomeScore,
    firstHalfAwayScore
  );

  const { error } = await supabase
    .from('predictions')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      actual_result: actualResult,
      is_correct: isCorrect,
      verified_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error verifying prediction:', error);
    throw error;
  }
}

/**
 * Checks if a prediction was correct based on the actual match result
 * Returns null if the prediction cannot be verified (e.g., first half result without HT data)
 */
function checkPredictionCorrect(
  type: string,
  prediction: string,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string,
  firstHalfHomeScore?: number,
  firstHalfAwayScore?: number
): boolean | null {
  const totalGoals = homeScore + awayScore;

  switch (type) {
    case PREDICTION_TYPES.MATCH_RESULT: {
      if (homeScore > awayScore && prediction.includes(homeTeam)) return true;
      if (awayScore > homeScore && prediction.includes(awayTeam)) return true;
      if (homeScore === awayScore && prediction.includes('Beraberlik')) return true;
      return false;
    }

    case PREDICTION_TYPES.OVER_UNDER: {
      if (prediction.includes('2.5 Üst') && totalGoals > 2.5) return true;
      if (prediction.includes('2.5 Alt') && totalGoals < 2.5) return true;
      if (prediction.includes('1.5 Üst') && totalGoals > 1.5) return true;
      if (prediction.includes('1.5 Alt') && totalGoals < 1.5) return true;
      if (prediction.includes('3.5 Üst') && totalGoals > 3.5) return true;
      if (prediction.includes('3.5 Alt') && totalGoals < 3.5) return true;
      return false;
    }

    case PREDICTION_TYPES.BTTS: {
      const bothScored = homeScore > 0 && awayScore > 0;
      if (prediction === 'Evet' && bothScored) return true;
      if (prediction === 'Hayır' && !bothScored) return true;
      return false;
    }

    case PREDICTION_TYPES.CORRECT_SCORE: {
      return prediction === `${homeScore}-${awayScore}`;
    }

    case PREDICTION_TYPES.FIRST_HALF: {
      // Cannot verify first half result without HT score data
      if (firstHalfHomeScore === undefined || firstHalfAwayScore === undefined) {
        return null; // Return null to indicate unverifiable
      }
      
      if (firstHalfHomeScore > firstHalfAwayScore && prediction.includes(homeTeam)) return true;
      if (firstHalfAwayScore > firstHalfHomeScore && prediction.includes(awayTeam)) return true;
      if (firstHalfHomeScore === firstHalfAwayScore && prediction.includes('Beraberlik')) return true;
      return false;
    }

    case PREDICTION_TYPES.HALF_TIME_FULL_TIME: {
      // Cannot verify without HT score data
      if (firstHalfHomeScore === undefined || firstHalfAwayScore === undefined) {
        return null;
      }
      
      // Parse HT/FT prediction (e.g., "Ev / Ev" or "Beraberlik / Deplasman")
      const [htPrediction, ftPrediction] = prediction.split(' / ');
      
      // Check HT result
      let htCorrect = false;
      if (firstHalfHomeScore > firstHalfAwayScore && htPrediction.includes('Ev')) htCorrect = true;
      if (firstHalfAwayScore > firstHalfHomeScore && htPrediction.includes('Dep')) htCorrect = true;
      if (firstHalfHomeScore === firstHalfAwayScore && htPrediction.includes('Ber')) htCorrect = true;
      
      // Check FT result
      let ftCorrect = false;
      if (homeScore > awayScore && ftPrediction.includes('Ev')) ftCorrect = true;
      if (awayScore > homeScore && ftPrediction.includes('Dep')) ftCorrect = true;
      if (homeScore === awayScore && ftPrediction.includes('Ber')) ftCorrect = true;
      
      return htCorrect && ftCorrect;
    }

    default:
      return false;
  }
}

export async function getPendingPredictions(): Promise<PredictionRecord[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .is('is_correct', null)
    .lt('match_date', today)
    .order('match_date', { ascending: false });

  if (error) {
    console.error('Error fetching pending predictions:', error);
    throw error;
  }

  return data as PredictionRecord[];
}

export interface TrendData {
  currentAccuracy: number;
  previousAccuracy: number;
  trend: number; // percentage point difference
  currentTotal: number;
  previousTotal: number;
}

export async function getAccuracyTrend(days: number = 7): Promise<TrendData> {
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - days);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - days);

  // Fetch predictions for both periods
  const { data: allPredictions, error } = await supabase
    .from('predictions')
    .select('created_at, is_correct')
    .not('is_correct', 'is', null)
    .gte('created_at', previousPeriodStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trend data:', error);
    return { currentAccuracy: 0, previousAccuracy: 0, trend: 0, currentTotal: 0, previousTotal: 0 };
  }

  // Split into current and previous periods
  const currentPeriodStartISO = currentPeriodStart.toISOString();
  
  const currentPeriod = allPredictions?.filter(p => p.created_at >= currentPeriodStartISO) || [];
  const previousPeriod = allPredictions?.filter(p => p.created_at < currentPeriodStartISO) || [];

  // Calculate accuracies
  const calculateAccuracy = (predictions: { is_correct: boolean | null }[]) => {
    if (predictions.length === 0) return 0;
    const correct = predictions.filter(p => p.is_correct === true).length;
    return (correct / predictions.length) * 100;
  };

  const currentAccuracy = calculateAccuracy(currentPeriod);
  const previousAccuracy = calculateAccuracy(previousPeriod);
  const trend = Math.round(currentAccuracy - previousAccuracy);

  return {
    currentAccuracy,
    previousAccuracy,
    trend,
    currentTotal: currentPeriod.length,
    previousTotal: previousPeriod.length,
  };
}

// New: Get premium-only stats (high confidence predictions only)
export interface PremiumStats {
  total: number;
  correct: number;
  accuracy: number;
}

export async function getPremiumStats(): Promise<PremiumStats> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('is_correct')
      .eq('is_premium', true)
      .not('is_correct', 'is', null);

    if (error) {
      console.error('Error fetching premium stats:', error);
      return { total: 0, correct: 0, accuracy: 0 };
    }

    const total = data?.length || 0;
    const correct = data?.filter(p => p.is_correct === true).length || 0;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    return { total, correct, accuracy };
  } catch (error) {
    console.error('Error in getPremiumStats:', error);
    return { total: 0, correct: 0, accuracy: 0 };
  }
}

// ============ USER-SPECIFIC FUNCTIONS ============

export async function getUserOverallStats(userId: string): Promise<OverallStats | null> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('is_correct')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }

    const total = data?.length || 0;
    const correct = data?.filter(p => p.is_correct === true).length || 0;
    const incorrect = data?.filter(p => p.is_correct === false).length || 0;
    const pending = data?.filter(p => p.is_correct === null).length || 0;
    const verified = total - pending;
    const accuracy = verified > 0 ? (correct / verified) * 100 : 0;

    // High confidence stats
    const highConfData = await supabase
      .from('predictions')
      .select('is_correct')
      .eq('user_id', userId)
      .eq('is_premium', true);

    const hcTotal = highConfData.data?.length || 0;
    const hcCorrect = highConfData.data?.filter(p => p.is_correct === true).length || 0;

    return {
      total_predictions: total,
      correct_predictions: correct,
      incorrect_predictions: incorrect,
      pending_predictions: pending,
      accuracy_percentage: accuracy,
      high_confidence_total: hcTotal,
      high_confidence_correct: hcCorrect,
    };
  } catch (error) {
    console.error('Error in getUserOverallStats:', error);
    return null;
  }
}

export async function getUserPredictionStats(userId: string): Promise<PredictionStats[]> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('prediction_type, is_correct')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user prediction stats:', error);
      return [];
    }

    // Group by prediction type
    const grouped = data?.reduce((acc, p) => {
      const type = p.prediction_type;
      if (!acc[type]) {
        acc[type] = { total: 0, correct: 0, incorrect: 0, pending: 0 };
      }
      acc[type].total++;
      if (p.is_correct === true) acc[type].correct++;
      else if (p.is_correct === false) acc[type].incorrect++;
      else acc[type].pending++;
      return acc;
    }, {} as Record<string, { total: number; correct: number; incorrect: number; pending: number }>);

    return Object.entries(grouped || {}).map(([type, stats]) => ({
      prediction_type: type,
      total_predictions: stats.total,
      correct_predictions: stats.correct,
      incorrect_predictions: stats.incorrect,
      pending_predictions: stats.pending,
      accuracy_percentage: stats.total - stats.pending > 0 
        ? (stats.correct / (stats.total - stats.pending)) * 100 
        : 0,
    }));
  } catch (error) {
    console.error('Error in getUserPredictionStats:', error);
    return [];
  }
}

export async function getUserRecentPredictions(userId: string, limit: number = 20): Promise<PredictionRecord[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user predictions:', error);
    return [];
  }

  return data as PredictionRecord[];
}

export async function getUserPremiumStats(userId: string): Promise<PremiumStats> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('is_correct')
      .eq('user_id', userId)
      .eq('is_premium', true)
      .not('is_correct', 'is', null);

    if (error) {
      console.error('Error fetching user premium stats:', error);
      return { total: 0, correct: 0, accuracy: 0 };
    }

    const total = data?.length || 0;
    const correct = data?.filter(p => p.is_correct === true).length || 0;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    return { total, correct, accuracy };
  } catch (error) {
    console.error('Error in getUserPremiumStats:', error);
    return { total: 0, correct: 0, accuracy: 0 };
  }
}

export async function getUserAccuracyTrend(userId: string, days: number = 7): Promise<TrendData> {
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - days);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - days);

  const { data: allPredictions, error } = await supabase
    .from('predictions')
    .select('created_at, is_correct')
    .eq('user_id', userId)
    .not('is_correct', 'is', null)
    .gte('created_at', previousPeriodStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user trend data:', error);
    return { currentAccuracy: 0, previousAccuracy: 0, trend: 0, currentTotal: 0, previousTotal: 0 };
  }

  const currentPeriodStartISO = currentPeriodStart.toISOString();
  
  const currentPeriod = allPredictions?.filter(p => p.created_at >= currentPeriodStartISO) || [];
  const previousPeriod = allPredictions?.filter(p => p.created_at < currentPeriodStartISO) || [];

  const calculateAccuracy = (predictions: { is_correct: boolean | null }[]) => {
    if (predictions.length === 0) return 0;
    const correct = predictions.filter(p => p.is_correct === true).length;
    return (correct / predictions.length) * 100;
  };

  const currentAccuracy = calculateAccuracy(currentPeriod);
  const previousAccuracy = calculateAccuracy(previousPeriod);
  const trend = Math.round(currentAccuracy - previousAccuracy);

  return {
    currentAccuracy,
    previousAccuracy,
    trend,
    currentTotal: currentPeriod.length,
    previousTotal: previousPeriod.length,
  };
}
