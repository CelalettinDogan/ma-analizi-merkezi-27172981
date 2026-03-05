import { supabase } from '@/integrations/supabase/client';

interface MLModelWeight {
  prediction_type: string;
  weights: Record<string, number>;
  feature_names: string[];
  feature_ranges: Record<string, { min: number; max: number }>;
  metrics: { accuracy: number; auc: number; sample_count: number };
  trained_at: string;
  is_active: boolean;
}

// 6-hour cache
let cachedWeights: MLModelWeight[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

function sigmoid(z: number): number {
  if (z > 500) return 1;
  if (z < -500) return 0;
  return 1 / (1 + Math.exp(-z));
}

async function getMLWeights(): Promise<MLModelWeight[]> {
  if (cachedWeights && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedWeights;
  }

  const { data, error } = await supabase
    .from('ml_model_weights' as any)
    .select('*')
    .eq('is_active', true);

  if (error || !data) {
    console.warn('[MLInference] Failed to fetch weights:', error);
    return [];
  }

  cachedWeights = data as unknown as MLModelWeight[];
  cacheTimestamp = Date.now();
  return cachedWeights;
}

export interface MLFeatures {
  home_form_score: number;
  away_form_score: number;
  home_goal_avg: number;
  away_goal_avg: number;
  position_diff: number;
  home_advantage_score: number;
  h2h_home_wins: number;
  h2h_away_wins: number;
  expected_goals: number;
  home_attack_index: number;
  home_defense_index: number;
  away_attack_index: number;
  away_defense_index: number;
  home_momentum: number;
  away_momentum: number;
  poisson_home_expected: number;
  poisson_away_expected: number;
}

export interface MLInferenceResult {
  probability: number; // 0-1
  confidence: number;  // 0-1
  predictionType: string;
  sampleCount: number;
  modelAccuracy: number;
}

export async function runMLInference(
  features: MLFeatures,
  predictionType: string
): Promise<MLInferenceResult | null> {
  try {
    const allWeights = await getMLWeights();
    const model = allWeights.find(w => w.prediction_type === predictionType);

    if (!model) return null;

    const minSampleThreshold = 50;
    if (model.metrics.sample_count < minSampleThreshold) {
      console.log(`[MLInference] ${predictionType}: only ${model.metrics.sample_count} samples, skipping (need ${minSampleThreshold})`);
      return null;
    }

    // Normalize features using stored ranges
    const normalizedValues: number[] = model.feature_names.map(name => {
      const rawVal = features[name as keyof MLFeatures] ?? 0;
      const range = model.feature_ranges[name];
      if (!range || range.max === range.min) return 0;
      return (rawVal - range.min) / (range.max - range.min);
    });

    // Compute z = w·x + bias
    let z = model.weights['bias'] || 0;
    for (let i = 0; i < normalizedValues.length; i++) {
      const featureName = model.feature_names[i];
      z += normalizedValues[i] * (model.weights[featureName] || 0);
    }

    const probability = sigmoid(z);

    return {
      probability,
      confidence: Math.abs(probability - 0.5) * 2, // 0 at 0.5, 1 at extremes
      predictionType,
      sampleCount: model.metrics.sample_count,
      modelAccuracy: model.metrics.accuracy,
    };
  } catch (error) {
    console.error('[MLInference] Error:', error);
    return null;
  }
}

export async function getAllMLInferences(features: MLFeatures): Promise<Record<string, MLInferenceResult>> {
  const types = ['Maç Sonucu', 'Toplam Gol Alt/Üst', 'Karşılıklı Gol', 'İlk Yarı Sonucu', 'Doğru Skor'];
  const results: Record<string, MLInferenceResult> = {};

  const promises = types.map(async (type) => {
    const result = await runMLInference(features, type);
    if (result) results[type] = result;
  });

  await Promise.all(promises);
  return results;
}

export function invalidateMLCache() {
  cachedWeights = null;
  cacheTimestamp = 0;
}
