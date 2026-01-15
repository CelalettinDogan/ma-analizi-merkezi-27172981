export interface BetSlipItem {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  predictionType: string;
  predictionValue: string;
  confidence: 'düşük' | 'orta' | 'yüksek';
  odds: number | null; // null when real odds not available
}

export interface BetSlip {
  id: string;
  created_at: string;
  name: string | null;
  total_odds: number | null;
  stake: number;
  potential_win: number | null;
  status: 'pending' | 'won' | 'lost' | 'partial';
  is_verified: boolean;
  items?: BetSlipItemRecord[];
}

export interface BetSlipItemRecord {
  id: string;
  slip_id: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  prediction_type: string;
  prediction_value: string;
  confidence: 'düşük' | 'orta' | 'yüksek';
  odds: number | null;
  is_correct: boolean | null;
  home_score: number | null;
  away_score: number | null;
  created_at: string;
}
