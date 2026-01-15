type Confidence = 'düşük' | 'orta' | 'yüksek';

// Base odds ranges by confidence
const CONFIDENCE_ODDS: Record<Confidence, { min: number; max: number }> = {
  yüksek: { min: 1.35, max: 1.65 },
  orta: { min: 1.70, max: 2.20 },
  düşük: { min: 2.30, max: 3.50 },
};

// Multipliers by prediction type
const TYPE_MULTIPLIERS: Record<string, number> = {
  'Maç Sonucu': 1.0,
  'Toplam Gol Alt/Üst': 0.95,
  'Karşılıklı Gol': 0.90,
  'Doğru Skor': 2.5,
  'İlk Yarı Sonucu': 1.10,
};

// Generate a pseudo-random but consistent value based on inputs
function getConsistentRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100) / 100;
}

export function calculateOdds(
  predictionType: string,
  predictionValue: string,
  confidence: Confidence,
  homeTeam: string,
  awayTeam: string
): number {
  const { min, max } = CONFIDENCE_ODDS[confidence];
  const typeMultiplier = TYPE_MULTIPLIERS[predictionType] || 1.0;
  
  // Use consistent random based on match details
  const seed = `${homeTeam}-${awayTeam}-${predictionType}-${predictionValue}`;
  const randomFactor = getConsistentRandom(seed);
  
  // Calculate base odds within confidence range
  const baseOdds = min + (max - min) * randomFactor;
  
  // Apply type multiplier
  const finalOdds = baseOdds * typeMultiplier;
  
  // Round to 2 decimal places
  return Math.round(finalOdds * 100) / 100;
}

export function calculateTotalOdds(items: { odds: number }[]): number {
  if (items.length === 0) return 1.00;
  
  const total = items.reduce((acc, item) => acc * item.odds, 1);
  return Math.round(total * 100) / 100;
}

export function calculatePotentialWin(totalOdds: number, stake: number): number {
  return Math.round(totalOdds * stake * 100) / 100;
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
