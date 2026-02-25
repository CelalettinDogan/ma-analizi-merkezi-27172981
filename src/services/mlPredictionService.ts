import { supabase } from '@/integrations/supabase/client';
import { TeamFeatures, H2HFeatures } from '@/utils/featureExtractor';

export interface AIPredictionResult {
  matchResult: {
    prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    confidence: number;
    reasoning: string;
  };
  totalGoals: {
    prediction: 'OVER_2_5' | 'UNDER_2_5';
    confidence: number;
    reasoning: string;
  };
  bothTeamsScore: {
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
  };
  correctScore: {
    prediction: string;
    confidence: number;
    reasoning: string;
  };
  firstHalf: {
    prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    confidence: number;
    reasoning: string;
  };
}

export interface MLPredictionResponse {
  success: boolean;
  predictions: AIPredictionResult;
  homeTeam: string;
  awayTeam: string;
}

// Get historical accuracy for feedback loop
export async function getHistoricalAccuracy(): Promise<{
  matchResult: number;
  totalGoals: number;
  bothTeamsScore: number;
  correctScore: number;
  firstHalf: number;
} | null> {
  try {
    const { data: stats, error } = await supabase
      .from('ml_model_stats')
      .select('prediction_type, accuracy_percentage');
    
    if (error || !stats || stats.length === 0) {
      return null;
    }

    const accuracyMap: Record<string, number> = {};
    stats.forEach(stat => {
      if (stat.prediction_type && stat.accuracy_percentage !== null) {
        accuracyMap[stat.prediction_type] = stat.accuracy_percentage / 100;
      }
    });

    return {
      matchResult: accuracyMap['Maç Sonucu'] ?? 0.5,
      totalGoals: accuracyMap['Toplam Gol Alt/Üst'] ?? 0.5,
      bothTeamsScore: accuracyMap['Karşılıklı Gol'] ?? 0.5,
      correctScore: accuracyMap['Doğru Skor'] ?? 0.2,
      firstHalf: accuracyMap['İlk Yarı Sonucu'] ?? 0.4,
    };
  } catch (error) {
    console.error('Error fetching historical accuracy:', error);
    return null;
  }
}

// Generate cache key for a match
function generateMatchCacheKey(homeTeam: string, awayTeam: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${homeTeam.toLowerCase().trim()}-${awayTeam.toLowerCase().trim()}-${today}`;
}

// Check if cached prediction exists and is valid
async function getCachedPrediction(matchKey: string): Promise<MLPredictionResponse | null> {
  try {
    const { data, error } = await supabase
      .from('cached_ai_predictions')
      .select('predictions')
      .eq('match_key', matchKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    
    console.log('[ML] Cache hit for:', matchKey);
    return data.predictions as unknown as MLPredictionResponse;
  } catch {
    return null;
  }
}

// Save prediction to cache
async function cachePrediction(
  matchKey: string,
  homeTeam: string,
  awayTeam: string,
  predictions: MLPredictionResponse
): Promise<void> {
  try {
    const matchDate = new Date().toISOString().split('T')[0];
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours

    // Use any to bypass strict typing for the new table not yet in types
    const insertData = {
      match_key: matchKey,
      predictions: JSON.parse(JSON.stringify(predictions)),
      home_team: homeTeam,
      away_team: awayTeam,
      match_date: matchDate,
      expires_at: expiresAt,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('cached_ai_predictions') as any).upsert(insertData, { onConflict: 'match_key' });
    
    console.log('[ML] Prediction cached for:', matchKey);
  } catch (error) {
    console.error('[ML] Failed to cache prediction:', error);
  }
}

// Call ML prediction edge function with caching
export async function getMLPrediction(
  homeTeam: TeamFeatures,
  awayTeam: TeamFeatures,
  h2h: H2HFeatures,
  league: string,
  poissonExtra?: {
    over25Prob?: number; // percentage 0-100
    leagueOver25Pct?: number; // percentage 0-100
    homeExpected?: number;
    awayExpected?: number;
  }
): Promise<MLPredictionResponse | null> {
  try {
    // 1. Check cache first
    const matchKey = generateMatchCacheKey(homeTeam.name, awayTeam.name);
    const cachedResult = await getCachedPrediction(matchKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    // 2. Get historical accuracy for feedback
    const historicalAccuracy = await getHistoricalAccuracy();

    // 3. Call AI if no cache
    const { data, error } = await supabase.functions.invoke('ml-prediction', {
      body: {
        homeTeam,
        awayTeam,
        h2h,
        league,
        historicalAccuracy,
        poisson: poissonExtra ? {
          homeExpected: poissonExtra.homeExpected,
          awayExpected: poissonExtra.awayExpected,
          over2_5Prob: poissonExtra.over25Prob,
        } : undefined,
        leagueOver25Pct: poissonExtra?.leagueOver25Pct,
      },
    });

    if (error) {
      console.error('ML Prediction error:', error);
      return null;
    }

    // 4. Cache successful result
    if (data?.success) {
      await cachePrediction(matchKey, homeTeam.name, awayTeam.name, data);
    }

    return data as MLPredictionResponse;
  } catch (error) {
    console.error('ML Prediction service error:', error);
    return null;
  }
}

// Convert AI prediction to confidence string
export function aiConfidenceToString(confidence: number): 'düşük' | 'orta' | 'yüksek' {
  if (confidence >= 0.7) return 'yüksek';
  if (confidence >= 0.5) return 'orta';
  return 'düşük';
}

// Convert AI result to display format
export function convertAIResultToDisplay(
  result: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN',
  homeTeam: string,
  awayTeam: string
): string {
  switch (result) {
    case 'HOME_WIN': return `${homeTeam} Kazanır`;
    case 'AWAY_WIN': return `${awayTeam} Kazanır`;
    case 'DRAW': return 'Beraberlik';
    default: return 'Belirsiz';
  }
}

// Convert goals prediction to display
export function convertGoalsPrediction(prediction: 'OVER_2_5' | 'UNDER_2_5'): string {
  return prediction === 'OVER_2_5' ? '2.5 Üst' : '2.5 Alt';
}

// Convert BTTS prediction to display
export function convertBTTSPrediction(prediction: 'YES' | 'NO'): string {
  return prediction === 'YES' ? 'Evet' : 'Hayır';
}

// Save prediction features to database
export async function savePredictionFeatures(
  predictionId: string,
  features: {
    home_form_score: number;
    away_form_score: number;
    home_goal_avg: number;
    away_goal_avg: number;
    position_diff: number;
    home_advantage_score: number;
    h2h_home_wins: number;
    h2h_away_wins: number;
    h2h_draws: number;
    expected_goals: number;
    ai_confidence: number;
    ai_reasoning: string;
    mathematical_confidence: number;
    hybrid_confidence: number;
    poisson_home_expected?: number | null;
    poisson_away_expected?: number | null;
    ai_prediction_value?: string | null;
    math_prediction_value?: string | null;
  }
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = {
      prediction_id: predictionId,
      ...features,
    };

    const { error } = await supabase
      .from('prediction_features')
      .insert(insertData);

    if (error) {
      console.error('Error saving prediction features:', error);
    }
  } catch (error) {
    console.error('Error in savePredictionFeatures:', error);
  }
}

// Update ML model stats after verification
export async function updateMLModelStats(
  predictionType: string,
  wasCorrect: boolean,
  aiWasCorrect?: boolean | null,
  mathWasCorrect?: boolean | null
): Promise<void> {
  try {
    // First, try to get existing stats
    const { data: existing } = await supabase
      .from('ml_model_stats')
      .select('*')
      .eq('prediction_type', predictionType)
      .single();

    if (existing) {
      // Update existing record
      const newTotal = (existing.total_predictions || 0) + 1;
      const newCorrect = (existing.correct_predictions || 0) + (wasCorrect ? 1 : 0);
      const accuracy = Math.round((newCorrect / newTotal) * 100 * 100) / 100;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        total_predictions: newTotal,
        correct_predictions: newCorrect,
        accuracy_percentage: accuracy,
        last_updated: new Date().toISOString(),
      };

      // Update AI-specific stats
      if (aiWasCorrect !== undefined && aiWasCorrect !== null) {
        const aiTotal = ((existing as any).ai_total || 0) + 1;
        const aiCorrect = ((existing as any).ai_correct || 0) + (aiWasCorrect ? 1 : 0);
        updateData.ai_total = aiTotal;
        updateData.ai_correct = aiCorrect;
        updateData.ai_accuracy = Math.round((aiCorrect / aiTotal) * 100 * 100) / 100;
      }

      // Update Math-specific stats
      if (mathWasCorrect !== undefined && mathWasCorrect !== null) {
        const mathTotal = ((existing as any).math_total || 0) + 1;
        const mathCorrect = ((existing as any).math_correct || 0) + (mathWasCorrect ? 1 : 0);
        updateData.math_total = mathTotal;
        updateData.math_correct = mathCorrect;
        updateData.math_accuracy = Math.round((mathCorrect / mathTotal) * 100 * 100) / 100;
      }

      await supabase
        .from('ml_model_stats')
        .update(updateData)
        .eq('prediction_type', predictionType);
    } else {
      // Create new record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        prediction_type: predictionType,
        total_predictions: 1,
        correct_predictions: wasCorrect ? 1 : 0,
        accuracy_percentage: wasCorrect ? 100 : 0,
      };

      if (aiWasCorrect !== undefined && aiWasCorrect !== null) {
        insertData.ai_total = 1;
        insertData.ai_correct = aiWasCorrect ? 1 : 0;
        insertData.ai_accuracy = aiWasCorrect ? 100 : 0;
      }

      if (mathWasCorrect !== undefined && mathWasCorrect !== null) {
        insertData.math_total = 1;
        insertData.math_correct = mathWasCorrect ? 1 : 0;
        insertData.math_accuracy = mathWasCorrect ? 100 : 0;
      }

      await supabase
        .from('ml_model_stats')
        .insert(insertData);
    }
  } catch (error) {
    console.error('Error updating ML model stats:', error);
  }
}

// Get AI vs Math accuracy weights for dynamic hybrid scoring
export async function getAIMathWeights(): Promise<{ aiWeight: number; mathWeight: number } | null> {
  try {
    const { data, error } = await supabase
      .from('ml_model_stats')
      .select('ai_total, ai_accuracy, math_total, math_accuracy');

    if (error || !data || data.length === 0) return null;

    let totalAiTotal = 0;
    let totalMathTotal = 0;
    let weightedAiAccuracy = 0;
    let weightedMathAccuracy = 0;

    data.forEach((stat: any) => {
      const aiT = stat.ai_total || 0;
      const mathT = stat.math_total || 0;
      totalAiTotal += aiT;
      totalMathTotal += mathT;
      weightedAiAccuracy += (stat.ai_accuracy || 0) * aiT;
      weightedMathAccuracy += (stat.math_accuracy || 0) * mathT;
    });

    // Need minimum 20 samples from each to use dynamic weights
    if (totalAiTotal < 20 || totalMathTotal < 20) return null;

    const avgAiAccuracy = weightedAiAccuracy / totalAiTotal;
    const avgMathAccuracy = weightedMathAccuracy / totalMathTotal;

    const total = avgAiAccuracy + avgMathAccuracy;
    if (total === 0) return null;

    return {
      aiWeight: avgAiAccuracy / total,
      mathWeight: avgMathAccuracy / total,
    };
  } catch (error) {
    console.error('Error fetching AI/Math weights:', error);
    return null;
  }
}
