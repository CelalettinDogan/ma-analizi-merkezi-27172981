// Prediction type constants
export const PREDICTION_TYPES = {
  MATCH_RESULT: 'Maç Sonucu',
  OVER_UNDER: 'Toplam Gol Alt/Üst',
  BTTS: 'Karşılıklı Gol',
  CORRECT_SCORE: 'Doğru Skor',
  FIRST_HALF: 'İlk Yarı Sonucu',
  HALF_TIME_FULL_TIME: 'İlk Yarı / Maç Sonucu',
  BOTH_HALVES: 'İki Yarıda da Gol',
} as const;

export const PREDICTION_TYPE_LABELS: Record<string, string> = {
  [PREDICTION_TYPES.MATCH_RESULT]: '1X2',
  [PREDICTION_TYPES.OVER_UNDER]: 'Ü/A',
  [PREDICTION_TYPES.BTTS]: 'KG',
  [PREDICTION_TYPES.CORRECT_SCORE]: 'DS',
  [PREDICTION_TYPES.FIRST_HALF]: 'İY',
  [PREDICTION_TYPES.HALF_TIME_FULL_TIME]: 'İY/MS',
  [PREDICTION_TYPES.BOTH_HALVES]: '2YG',
};

// Confidence level constants
export const CONFIDENCE_LEVELS = {
  LOW: 'düşük',
  MEDIUM: 'orta',
  HIGH: 'yüksek',
} as const;

export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[keyof typeof CONFIDENCE_LEVELS];

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 50,
  LOW: 0,
} as const;

// League codes
export const LEAGUE_CODES = {
  PREMIER_LEAGUE: 'PL',
  BUNDESLIGA: 'BL1',
  LA_LIGA: 'PD',
  SERIE_A: 'SA',
  LIGUE_1: 'FL1',
  CHAMPIONS_LEAGUE: 'CL',
} as const;

export const LEAGUE_NAMES: Record<string, string> = {
  [LEAGUE_CODES.PREMIER_LEAGUE]: 'İngiltere Premier Ligi',
  [LEAGUE_CODES.BUNDESLIGA]: 'Almanya Bundesliga',
  [LEAGUE_CODES.LA_LIGA]: 'İspanya La Liga',
  [LEAGUE_CODES.SERIE_A]: 'İtalya Serie A',
  [LEAGUE_CODES.LIGUE_1]: 'Fransa Ligue 1',
  [LEAGUE_CODES.CHAMPIONS_LEAGUE]: 'UEFA Şampiyonlar Ligi',
};

// Match importance levels
export const MATCH_IMPORTANCE = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

// Season phases
export const SEASON_PHASES = {
  EARLY: 'early',
  MID: 'mid',
  LATE: 'late',
} as const;

// API cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  LIVE_MATCHES: 2 * 60 * 1000, // 2 minutes
  STANDINGS: 60 * 60 * 1000, // 1 hour
  STANDARD: 30 * 60 * 1000, // 30 minutes
} as const;

// Rate limiting
export const RATE_LIMITS = {
  API_INTERVAL_MS: 6500, // 6.5 seconds between requests
  MAX_REQUESTS_PER_MINUTE: 10,
} as const;
