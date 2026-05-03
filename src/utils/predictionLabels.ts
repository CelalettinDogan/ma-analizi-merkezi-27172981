import type { TFunction } from 'i18next';
import i18n from '@/i18n/config';
import { PREDICTION_TYPES } from '@/constants/predictions';

/**
 * Maps the canonical Turkish prediction type (data layer enum) to the
 * localized i18n key in `predictions:types.*`.
 */
const TYPE_TO_KEY: Record<string, string> = {
  [PREDICTION_TYPES.MATCH_RESULT]: 'matchResult',
  [PREDICTION_TYPES.OVER_UNDER]: 'overUnder',
  [PREDICTION_TYPES.BTTS]: 'btts',
  [PREDICTION_TYPES.CORRECT_SCORE]: 'correctScore',
  [PREDICTION_TYPES.FIRST_HALF]: 'firstHalf',
  [PREDICTION_TYPES.HALF_TIME_FULL_TIME]: 'halfTimeFullTime',
  [PREDICTION_TYPES.FIRST_HALF_OVER_UNDER]: 'firstHalfOverUnder',
};

const tt = (t: TFunction | undefined, key: string, opts?: Record<string, unknown>): string => {
  if (t) return t(key, opts) as string;
  return i18n.t(key, opts) as string;
};

/** Localizes a prediction type label (e.g. "İlk Yarı Sonucu" → "Half-Time Result"). */
export const formatPredictionType = (
  t: TFunction | undefined,
  type: string | undefined,
): string => {
  if (!type) return '';
  const key = TYPE_TO_KEY[type];
  if (!key) return type;
  return tt(t, `predictions:types.${key}`);
};

/**
 * Localizes a prediction value string. Predictions are stored in Turkish
 * for backward compatibility with verification logic and DB rows; this
 * helper translates them to the active locale for display only.
 */
export const formatPredictionValue = (
  t: TFunction | undefined,
  value: string | undefined,
): string => {
  if (!value) return '';
  const v = value.trim();

  // Score "1-0" or "1:0" — language agnostic
  if (/^\d+\s*[-:]\s*\d+$/.test(v)) return v.replace(/\s+/g, '');

  // Literals
  const literals: Record<string, string> = {
    'Beraberlik': 'predictions:outcomes.draw',
    'Evet': 'predictions:outcomes.yes',
    'Hayır': 'predictions:outcomes.no',
    'Var': 'predictions:outcomes.yes',
    'Yok': 'predictions:outcomes.no',
  };
  if (literals[v]) return tt(t, literals[v]);

  // "{Team} Kazanır"
  const winMatch = v.match(/^(.+?)\s+Kazanır$/);
  if (winMatch) {
    return tt(t, 'predictions:values.teamWins', { team: winMatch[1] });
  }

  // "İY {n.n} Üst|Alt"
  const htOu = v.match(/^İY\s+(\d+(?:\.\d+)?)\s+(Üst|Alt)$/);
  if (htOu) {
    const side = htOu[2] === 'Üst' ? 'over' : 'under';
    return tt(t, `predictions:values.ht${side === 'over' ? 'Over' : 'Under'}`, { line: htOu[1] });
  }

  // "{n.n} Üst|Alt"
  const ou = v.match(/^(\d+(?:\.\d+)?)\s+(Üst|Alt)$/);
  if (ou) {
    const side = ou[2] === 'Üst' ? 'over' : 'under';
    return tt(t, `predictions:values.${side}`, { line: ou[1] });
  }

  // "İY {x} / MS {y}" or "{x} / {y}" (HT/FT) — split & translate sides
  const htft = v.match(/^(.+?)\s*\/\s*(.+)$/);
  if (htft) {
    const left = formatPredictionValue(t, htft[1]);
    const right = formatPredictionValue(t, htft[2]);
    return tt(t, 'predictions:values.htft', { ht: left, ft: right });
  }

  return v;
};

/** Localizes the confidence string ("yüksek"|"orta"|"düşük") used as DB enum. */
export const formatConfidenceLabel = (
  t: TFunction | undefined,
  level: string | undefined,
): string => {
  if (level === 'yüksek') return tt(t, 'analysis:confidence.high');
  if (level === 'orta') return tt(t, 'analysis:confidence.medium');
  if (level === 'düşük') return tt(t, 'analysis:confidence.low');
  return level ?? '';
};
