export interface PredictionRecord {
  id: string;
  created_at: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  prediction_type: string;
  prediction_value: string;
  confidence: 'düşük' | 'orta' | 'yüksek';
  reasoning: string | null;
  actual_result: string | null;
  is_correct: boolean | null;
  verified_at: string | null;
  home_score: number | null;
  away_score: number | null;
}

export interface PredictionStats {
  prediction_type: string;
  total_predictions: number;
  correct_predictions: number;
  incorrect_predictions: number;
  pending_predictions: number;
  accuracy_percentage: number | null;
}

export interface OverallStats {
  total_predictions: number;
  correct_predictions: number;
  incorrect_predictions: number;
  pending_predictions: number;
  accuracy_percentage: number | null;
  high_confidence_correct: number;
  high_confidence_total: number;
}

export const PREDICTION_TYPE_LABELS: Record<string, string> = {
  'Maç Sonucu': 'Maç Sonucu',
  'Toplam Gol Alt/Üst': 'Alt/Üst',
  'Karşılıklı Gol': 'KG Var/Yok',
  'Doğru Skor': 'Doğru Skor',
  'İlk Yarı Sonucu': 'İY Sonucu',
};
