import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEATURE_NAMES = [
  'home_form_score', 'away_form_score', 'home_goal_avg', 'away_goal_avg',
  'position_diff', 'home_advantage_score', 'h2h_home_wins', 'h2h_away_wins',
  'expected_goals', 'home_attack_index', 'home_defense_index',
  'away_attack_index', 'away_defense_index', 'home_momentum', 'away_momentum',
  'poisson_home_expected', 'poisson_away_expected',
];

const MIN_SAMPLES = 30;
const LEARNING_RATE = 0.01;
const ITERATIONS = 1000;
const L2_LAMBDA = 0.01;

interface FeatureRow {
  prediction_id: string;
  home_form_score: number | null;
  away_form_score: number | null;
  home_goal_avg: number | null;
  away_goal_avg: number | null;
  position_diff: number | null;
  home_advantage_score: number | null;
  h2h_home_wins: number | null;
  h2h_away_wins: number | null;
  expected_goals: number | null;
  home_attack_index: number | null;
  home_defense_index: number | null;
  away_attack_index: number | null;
  away_defense_index: number | null;
  home_momentum: number | null;
  away_momentum: number | null;
  poisson_home_expected: number | null;
  poisson_away_expected: number | null;
  was_correct: boolean | null;
}

function sigmoid(z: number): number {
  if (z > 500) return 1;
  if (z < -500) return 0;
  return 1 / (1 + Math.exp(-z));
}

function extractFeatureVector(row: FeatureRow): number[] {
  return FEATURE_NAMES.map(name => {
    const val = row[name as keyof FeatureRow];
    return typeof val === 'number' ? val : 0;
  });
}

function computeMinMax(data: number[][]): { mins: number[]; maxs: number[] } {
  const numFeatures = data[0].length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);
  
  for (const row of data) {
    for (let j = 0; j < numFeatures; j++) {
      if (row[j] < mins[j]) mins[j] = row[j];
      if (row[j] > maxs[j]) maxs[j] = row[j];
    }
  }
  return { mins, maxs };
}

function normalizeData(data: number[][], mins: number[], maxs: number[]): number[][] {
  return data.map(row =>
    row.map((val, j) => {
      const range = maxs[j] - mins[j];
      return range > 0 ? (val - mins[j]) / range : 0;
    })
  );
}

function trainLogisticRegression(
  X: number[][],
  y: number[],
): { weights: number[]; bias: number } {
  const numFeatures = X[0].length;
  const n = X.length;
  const w = new Array(numFeatures).fill(0);
  let b = 0;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const gradW = new Array(numFeatures).fill(0);
    let gradB = 0;

    for (let i = 0; i < n; i++) {
      const z = X[i].reduce((sum, xj, j) => sum + xj * w[j], 0) + b;
      const pred = sigmoid(z);
      const err = pred - y[i];

      for (let j = 0; j < numFeatures; j++) {
        gradW[j] += err * X[i][j] / n + (L2_LAMBDA * w[j]) / n;
      }
      gradB += err / n;
    }

    for (let j = 0; j < numFeatures; j++) {
      w[j] -= LEARNING_RATE * gradW[j];
    }
    b -= LEARNING_RATE * gradB;
  }

  return { weights: w, bias: b };
}

function calculateAUC(X: number[][], y: number[], weights: number[], bias: number): number {
  const scores = X.map(row => sigmoid(row.reduce((s, xj, j) => s + xj * weights[j], 0) + bias));
  
  const positives: number[] = [];
  const negatives: number[] = [];
  y.forEach((label, i) => {
    if (label === 1) positives.push(scores[i]);
    else negatives.push(scores[i]);
  });

  if (positives.length === 0 || negatives.length === 0) return 0.5;

  let concordant = 0;
  for (const p of positives) {
    for (const n of negatives) {
      if (p > n) concordant++;
      else if (p === n) concordant += 0.5;
    }
  }
  return concordant / (positives.length * negatives.length);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Prediction types to train
    const predictionTypes = [
      'Maç Sonucu', 'Toplam Gol Alt/Üst', 'Karşılıklı Gol',
      'İlk Yarı Sonucu', 'Doğru Skor',
    ];

    const results: Record<string, any> = {};

    for (const predType of predictionTypes) {
      // Fetch verified data: join prediction_features with predictions
      const { data: features, error } = await supabase
        .from('prediction_features')
        .select('*, predictions!inner(prediction_type, is_correct)')
        .eq('predictions.prediction_type', predType)
        .not('predictions.is_correct', 'is', null);

      if (error) {
        console.error(`[train] Error fetching ${predType}:`, error);
        results[predType] = { error: error.message };
        continue;
      }

      if (!features || features.length < MIN_SAMPLES) {
        console.log(`[train] ${predType}: only ${features?.length || 0} samples, need ${MIN_SAMPLES}`);
        results[predType] = { skipped: true, samples: features?.length || 0 };
        continue;
      }

      // Extract feature vectors and labels
      const rawX: number[][] = [];
      const y: number[] = [];

      for (const row of features) {
        const fv = extractFeatureVector(row as unknown as FeatureRow);
        const label = (row as any).predictions?.is_correct ? 1 : 0;
        rawX.push(fv);
        y.push(label);
      }

      // Normalize
      const { mins, maxs } = computeMinMax(rawX);
      const X = normalizeData(rawX, mins, maxs);

      // Train
      const { weights, bias } = trainLogisticRegression(X, y);

      // Calculate metrics
      let correct = 0;
      for (let i = 0; i < X.length; i++) {
        const z = X[i].reduce((s, xj, j) => s + xj * weights[j], 0) + bias;
        const pred = sigmoid(z) >= 0.5 ? 1 : 0;
        if (pred === y[i]) correct++;
      }
      const accuracy = correct / X.length;
      const auc = calculateAUC(X, y, weights, bias);

      // Build weights object
      const weightsObj: Record<string, number> = {};
      FEATURE_NAMES.forEach((name, i) => { weightsObj[name] = weights[i]; });
      weightsObj['bias'] = bias;

      // Build feature ranges for inference normalization
      const rangesObj: Record<string, { min: number; max: number }> = {};
      FEATURE_NAMES.forEach((name, i) => {
        rangesObj[name] = { min: mins[i], max: maxs[i] };
      });

      // Upsert to ml_model_weights
      const { error: upsertError } = await supabase
        .from('ml_model_weights')
        .upsert({
          prediction_type: predType,
          weights: weightsObj,
          feature_names: FEATURE_NAMES,
          feature_ranges: rangesObj,
          metrics: { accuracy, auc, sample_count: features.length },
          trained_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'prediction_type' });

      if (upsertError) {
        console.error(`[train] Upsert error for ${predType}:`, upsertError);
        results[predType] = { error: upsertError.message };
      } else {
        console.log(`[train] ${predType}: accuracy=${(accuracy * 100).toFixed(1)}%, AUC=${auc.toFixed(3)}, samples=${features.length}`);
        results[predType] = { accuracy, auc, samples: features.length };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[train-ml-model] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
