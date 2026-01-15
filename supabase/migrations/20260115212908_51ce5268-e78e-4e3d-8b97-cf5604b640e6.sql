-- Extend match_history table with advanced features
ALTER TABLE public.match_history 
ADD COLUMN IF NOT EXISTS home_home_form TEXT,
ADD COLUMN IF NOT EXISTS away_away_form TEXT,
ADD COLUMN IF NOT EXISTS home_attack_index NUMERIC,
ADD COLUMN IF NOT EXISTS home_defense_index NUMERIC,
ADD COLUMN IF NOT EXISTS away_attack_index NUMERIC,
ADD COLUMN IF NOT EXISTS away_defense_index NUMERIC,
ADD COLUMN IF NOT EXISTS match_importance TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS is_derby BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS home_rest_days INTEGER,
ADD COLUMN IF NOT EXISTS away_rest_days INTEGER,
ADD COLUMN IF NOT EXISTS home_momentum NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS away_momentum NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS season_phase TEXT DEFAULT 'mid';

-- Create league_averages table for statistical baselines
CREATE TABLE IF NOT EXISTS public.league_averages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league TEXT NOT NULL,
  season TEXT NOT NULL,
  avg_goals_per_match NUMERIC DEFAULT 2.5,
  avg_home_goals NUMERIC DEFAULT 1.5,
  avg_away_goals NUMERIC DEFAULT 1.0,
  home_win_percentage NUMERIC DEFAULT 45,
  draw_percentage NUMERIC DEFAULT 25,
  away_win_percentage NUMERIC DEFAULT 30,
  btts_percentage NUMERIC DEFAULT 50,
  over_2_5_percentage NUMERIC DEFAULT 50,
  over_1_5_percentage NUMERIC DEFAULT 75,
  over_3_5_percentage NUMERIC DEFAULT 30,
  clean_sheet_home_pct NUMERIC DEFAULT 35,
  clean_sheet_away_pct NUMERIC DEFAULT 25,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league, season)
);

-- Insert default league averages for supported leagues
INSERT INTO public.league_averages (league, season, avg_goals_per_match, avg_home_goals, avg_away_goals, home_win_percentage, draw_percentage, away_win_percentage, btts_percentage, over_2_5_percentage)
VALUES 
  ('PL', '2024-25', 2.85, 1.55, 1.30, 44, 24, 32, 55, 55),
  ('PD', '2024-25', 2.60, 1.45, 1.15, 47, 23, 30, 50, 48),
  ('BL1', '2024-25', 3.15, 1.70, 1.45, 43, 22, 35, 58, 62),
  ('SA', '2024-25', 2.70, 1.50, 1.20, 45, 26, 29, 52, 52),
  ('FL1', '2024-25', 2.55, 1.40, 1.15, 46, 25, 29, 48, 48),
  ('CL', '2024-25', 2.90, 1.55, 1.35, 42, 23, 35, 54, 56)
ON CONFLICT (league, season) DO NOTHING;

-- Extend prediction_features with new columns
ALTER TABLE public.prediction_features
ADD COLUMN IF NOT EXISTS home_attack_index NUMERIC,
ADD COLUMN IF NOT EXISTS home_defense_index NUMERIC,
ADD COLUMN IF NOT EXISTS away_attack_index NUMERIC,
ADD COLUMN IF NOT EXISTS away_defense_index NUMERIC,
ADD COLUMN IF NOT EXISTS match_importance TEXT,
ADD COLUMN IF NOT EXISTS is_derby BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS home_momentum NUMERIC,
ADD COLUMN IF NOT EXISTS away_momentum NUMERIC,
ADD COLUMN IF NOT EXISTS poisson_home_expected NUMERIC,
ADD COLUMN IF NOT EXISTS poisson_away_expected NUMERIC,
ADD COLUMN IF NOT EXISTS similar_matches_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS similar_matches_home_win_pct NUMERIC,
ADD COLUMN IF NOT EXISTS similar_matches_draw_pct NUMERIC,
ADD COLUMN IF NOT EXISTS similar_matches_away_win_pct NUMERIC;

-- Allow public read access to league_averages
ALTER TABLE public.league_averages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to league_averages"
ON public.league_averages
FOR SELECT
USING (true);