/**
 * Market-Aware Hybrid Scoring Engine
 * 
 * Her market (1X2, BTTS, O/U vb.) için bağımsız bir Final Market Score (FMS) hesaplar.
 * FMS = (signalStrength × 0.35) + (modelAgreement × 0.25) + (historicalReliability × 0.20) + (edgeClarity × 0.20)
 */

import { Prediction } from '@/types/match';
import { PREDICTION_TYPES } from '@/constants/predictions';

// Market-specific calibration config
export interface MarketConfig {
  uncertaintyCenter: number;  // Belirsizlik merkezi (1X2: 33.3, binary: 50)
  volatilityPenalty: number;  // Volatilite cezası (1X2: 0.15, binary: 0)
  minEdgeThreshold: number;   // Minimum edge eşiği
  maxRawProbability: number;  // Normalleştirme için max ham olasılık
}

export const MARKET_CONFIGS: Record<string, MarketConfig> = {
  [PREDICTION_TYPES.MATCH_RESULT]: {
    uncertaintyCenter: 33.3,
    volatilityPenalty: 0.15,
    minEdgeThreshold: 12,
    maxRawProbability: 75,
  },
  [PREDICTION_TYPES.OVER_UNDER]: {
    uncertaintyCenter: 50,
    volatilityPenalty: 0,
    minEdgeThreshold: 8,
    maxRawProbability: 80,
  },
  [PREDICTION_TYPES.BTTS]: {
    uncertaintyCenter: 50,
    volatilityPenalty: 0,
    minEdgeThreshold: 8,
    maxRawProbability: 80,
  },
  [PREDICTION_TYPES.CORRECT_SCORE]: {
    uncertaintyCenter: 10,
    volatilityPenalty: 0.25,
    minEdgeThreshold: 5,
    maxRawProbability: 20,
  },
  [PREDICTION_TYPES.FIRST_HALF]: {
    uncertaintyCenter: 33.3,
    volatilityPenalty: 0.10,
    minEdgeThreshold: 10,
    maxRawProbability: 60,
  },
  [PREDICTION_TYPES.HALF_TIME_FULL_TIME]: {
    uncertaintyCenter: 11.1, // 9-way market
    volatilityPenalty: 0.20,
    minEdgeThreshold: 8,
    maxRawProbability: 40,
  },
  [PREDICTION_TYPES.FIRST_HALF_OVER_UNDER]: {
    uncertaintyCenter: 50,
    volatilityPenalty: 0,
    minEdgeThreshold: 10,
    maxRawProbability: 90,
  },
};

// FMS component weights
const WEIGHTS = {
  signalStrength: 0.35,
  modelAgreement: 0.25,
  historicalReliability: 0.20,
  edgeClarity: 0.20,
} as const;

export interface MarketReliabilityData {
  predictionType: string;
  accuracyPercentage: number | null;
  totalPredictions: number | null;
}

/**
 * Sinyal gücü hesapla: Olasılığın belirsizlik merkezinden uzaklığı
 * Market türüne göre normalize edilir
 */
function calculateSignalStrength(probability: number, config: MarketConfig): number {
  const edge = Math.abs(probability - config.uncertaintyCenter);
  
  if (edge < config.minEdgeThreshold) return 0; // Minimum edge altında sinyal yok
  
  // Normalize to 0-100 based on max possible edge
  const maxEdge = config.maxRawProbability - config.uncertaintyCenter;
  const normalizedEdge = Math.min((edge / maxEdge) * 100, 100);
  
  return normalizedEdge;
}

/**
 * Model uyumu hesapla: AI ve Math aynı yönde mi?
 * 0 = farklı yönler, 50 = kısmi uyum, 100 = tam uyum
 */
function calculateModelAgreement(prediction: Prediction, mathPrediction?: Prediction): number {
  if (!prediction.isAIPowered || !mathPrediction) return 50; // Tek model, nötr
  
  // Aynı prediction value = tam uyum
  if (prediction.prediction === mathPrediction.prediction) return 100;
  
  // Farklı prediction value = uyumsuzluk
  return 0;
}

/**
 * Edge netliği: Olasılığın belirsizlik bölgesinden (merkez ± %5) ne kadar uzak olduğu
 */
function calculateEdgeClarity(probability: number, config: MarketConfig): number {
  const uncertaintyBandWidth = 5; // ± 5 puan belirsizlik bölgesi
  const distFromCenter = Math.abs(probability - config.uncertaintyCenter);
  
  if (distFromCenter <= uncertaintyBandWidth) return 0; // Belirsizlik bölgesinde
  
  const clarityRaw = distFromCenter - uncertaintyBandWidth;
  // Normalize: max olası clarity
  const maxClarity = config.maxRawProbability - config.uncertaintyCenter - uncertaintyBandWidth;
  
  return Math.min((clarityRaw / Math.max(maxClarity, 1)) * 100, 100);
}

/**
 * Risk seviyesi hesapla
 */
export function calculateRiskLevel(marketScore: number, signalStrength: number): 'low' | 'medium' | 'high' {
  if (marketScore >= 65 && signalStrength >= 50) return 'low';
  if (marketScore >= 40 || signalStrength >= 30) return 'medium';
  return 'high';
}

/**
 * Tek bir prediction için Final Market Score hesapla
 */
export function calculateMarketScore(
  prediction: Prediction,
  mathPrediction?: Prediction,
  historicalAccuracy?: number | null,
  historicalTotal?: number | null,
): {
  marketScore: number;
  signalStrength: number;
  modelAgreement: number;
  historicalReliability: number;
  edgeClarity: number;
  riskLevel: 'low' | 'medium' | 'high';
} {
  const config = MARKET_CONFIGS[prediction.type] || MARKET_CONFIGS[PREDICTION_TYPES.MATCH_RESULT];
  
  // Probability: use raw Poisson probability or estimate from confidence
  const probability = prediction.probability || estimateProbabilityFromConfidence(prediction, config);
  
  // 1. Signal Strength
  const signalStrength = calculateSignalStrength(probability, config);
  
  // 2. Model Agreement
  const modelAgreement = calculateModelAgreement(prediction, mathPrediction);
  
  // 3. Historical Reliability (ml_model_stats'dan)
  let historicalReliability = 50; // Default nötr
  if (historicalAccuracy !== null && historicalAccuracy !== undefined && historicalTotal && historicalTotal >= 10) {
    historicalReliability = Math.min(historicalAccuracy, 100);
  }
  
  // 4. Edge Clarity
  const edgeClarity = calculateEdgeClarity(probability, config);
  
  // Raw FMS
  let rawFMS = 
    signalStrength * WEIGHTS.signalStrength +
    modelAgreement * WEIGHTS.modelAgreement +
    historicalReliability * WEIGHTS.historicalReliability +
    edgeClarity * WEIGHTS.edgeClarity;
  
  // Apply volatility penalty (1X2 marketi daha volatil)
  rawFMS *= (1 - config.volatilityPenalty);
  
  // Clamp to 0-100
  const marketScore = Math.max(0, Math.min(100, Math.round(rawFMS)));
  
  const riskLevel = calculateRiskLevel(marketScore, signalStrength);
  
  return {
    marketScore,
    signalStrength: Math.round(signalStrength),
    modelAgreement: Math.round(modelAgreement),
    historicalReliability: Math.round(historicalReliability),
    edgeClarity: Math.round(edgeClarity),
    riskLevel,
  };
}

/**
 * Probability yoksa confidence'dan tahmin et
 */
function estimateProbabilityFromConfidence(prediction: Prediction, config: MarketConfig): number {
  const ai = prediction.aiConfidence || 0;
  const math = prediction.mathConfidence || 0;
  
  // AI/Math confidence varsa, onlardan olasılık tahmin et
  if (ai > 0 || math > 0) {
    const avgConf = ai > 0 && math > 0 ? (ai + math) / 2 : (ai || math);
    // Map 0-1 confidence to probability range above uncertainty center
    return config.uncertaintyCenter + (avgConf * (config.maxRawProbability - config.uncertaintyCenter));
  }
  
  // String confidence'dan
  switch (prediction.confidence) {
    case 'yüksek': return config.uncertaintyCenter + config.minEdgeThreshold * 2;
    case 'orta': return config.uncertaintyCenter + config.minEdgeThreshold;
    default: return config.uncertaintyCenter + config.minEdgeThreshold * 0.5;
  }
}

/**
 * Tüm prediction'lara market score ekle ve en iyisini işaretle
 */
export function enrichPredictionsWithMarketScores(
  predictions: Prediction[],
  mathPredictions: Prediction[],
  historicalData: MarketReliabilityData[],
): Prediction[] {
  // Her prediction için FMS hesapla
  const enriched = predictions.map(prediction => {
    const mathPred = mathPredictions.find(mp => mp.type === prediction.type);
    const historical = historicalData.find(h => h.predictionType === prediction.type);
    
    const scores = calculateMarketScore(
      prediction,
      mathPred,
      historical?.accuracyPercentage,
      historical?.totalPredictions,
    );
    
    return {
      ...prediction,
      marketScore: scores.marketScore,
      signalStrength: scores.signalStrength,
      modelAgreement: scores.modelAgreement,
      historicalReliability: scores.historicalReliability,
      edgeClarity: scores.edgeClarity,
      riskLevel: scores.riskLevel,
      isRecommended: false,
    };
  });
  
  // En yüksek marketScore'a sahip olanı isRecommended yap
  if (enriched.length > 0) {
    const bestIndex = enriched.reduce((bestIdx, curr, idx) => {
      return (curr.marketScore || 0) > (enriched[bestIdx].marketScore || 0) ? idx : bestIdx;
    }, 0);
    enriched[bestIndex].isRecommended = true;
  }
  
  // marketScore'a göre sırala (yüksekten düşüğe)
  enriched.sort((a, b) => (b.marketScore || 0) - (a.marketScore || 0));
  
  return enriched;
}
