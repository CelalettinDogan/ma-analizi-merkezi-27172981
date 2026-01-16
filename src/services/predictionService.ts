import { supabase } from '@/integrations/supabase/client';
import { Prediction } from '@/types/match';
import { PredictionRecord, PredictionStats, OverallStats } from '@/types/prediction';

export async function savePredictions(
  league: string,
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  predictions: Prediction[],
  userId?: string
): Promise<void> {
  const records = predictions.map(p => ({
    league,
    home_team: homeTeam,
    away_team: awayTeam,
    match_date: matchDate,
    prediction_type: p.type,
    prediction_value: p.prediction,
    confidence: p.confidence,
    reasoning: p.reasoning,
    user_id: userId || null,
  }));

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
  awayScore: number
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
    prediction.away_team
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

function checkPredictionCorrect(
  type: string,
  prediction: string,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string
): boolean {
  const totalGoals = homeScore + awayScore;

  switch (type) {
    case 'Maç Sonucu': {
      if (homeScore > awayScore && prediction.includes(homeTeam)) return true;
      if (awayScore > homeScore && prediction.includes(awayTeam)) return true;
      if (homeScore === awayScore && prediction.includes('Beraberlik')) return true;
      return false;
    }

    case 'Toplam Gol Alt/Üst': {
      if (prediction.includes('2.5 Üst') && totalGoals > 2.5) return true;
      if (prediction.includes('2.5 Alt') && totalGoals < 2.5) return true;
      return false;
    }

    case 'Karşılıklı Gol': {
      const bothScored = homeScore > 0 && awayScore > 0;
      if (prediction === 'Evet' && bothScored) return true;
      if (prediction === 'Hayır' && !bothScored) return true;
      return false;
    }

    case 'Doğru Skor': {
      return prediction === `${homeScore}-${awayScore}`;
    }

    case 'İlk Yarı Sonucu': {
      // Cannot verify first half result with only full time score
      // For now, mark as correct if final result matches
      if (homeScore > awayScore && prediction.includes(homeTeam)) return true;
      if (awayScore > homeScore && prediction.includes(awayTeam)) return true;
      if (homeScore === awayScore && prediction.includes('Beraberlik')) return true;
      return false;
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
