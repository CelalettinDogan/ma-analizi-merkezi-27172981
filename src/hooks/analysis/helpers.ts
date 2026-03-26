// Shared helper functions for match analysis

// 3 katmanlı hibrit güven hesaplama: AI + Math + ML
export function calculateHybridConfidence(
  aiConfidence: number,
  mathConfidence: number,
  dynamicWeights?: { aiWeight: number; mathWeight: number } | null,
  mlConfidence?: number | null
): 'düşük' | 'orta' | 'yüksek' {
  let hybrid: number;
  
  if (mlConfidence != null && mlConfidence > 0) {
    const mlWeight = 0.2;
    if (dynamicWeights) {
      const remainingWeight = 1 - mlWeight;
      hybrid = aiConfidence * dynamicWeights.aiWeight * remainingWeight 
             + mathConfidence * dynamicWeights.mathWeight * remainingWeight 
             + mlConfidence * mlWeight;
    } else {
      hybrid = aiConfidence * 0.35 + mathConfidence * 0.35 + mlConfidence * 0.2 + 0.5 * 0.1;
    }
  } else if (dynamicWeights) {
    hybrid = aiConfidence * dynamicWeights.aiWeight + mathConfidence * dynamicWeights.mathWeight;
  } else {
    hybrid = aiConfidence * 0.4 + mathConfidence * 0.4 + 0.5 * 0.2;
  }
  
  if (hybrid >= 0.7) return 'yüksek';
  if (hybrid >= 0.5) return 'orta';
  return 'düşük';
}

// Matematiksel güven değerini number'a çevir
export function mathConfidenceToNumber(confidence: 'düşük' | 'orta' | 'yüksek'): number {
  switch (confidence) {
    case 'yüksek': return 0.8;
    case 'orta': return 0.6;
    case 'düşük': return 0.4;
  }
}

// Form string'inden skor hesapla (0-100)
export function calculateFormScore(form: string | null): number {
  if (!form) return 50;
  let score = 0;
  const chars = form.split('');
  chars.forEach((char, index) => {
    const weight = (chars.length - index) / chars.length;
    if (char === 'W') score += 20 * weight;
    else if (char === 'D') score += 10 * weight;
  });
  return Math.min(Math.round(score), 100);
}
