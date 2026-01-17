-- Create cached_matches table for storing API data
CREATE TABLE IF NOT EXISTS public.cached_matches (
  id SERIAL PRIMARY KEY,
  match_id INTEGER UNIQUE NOT NULL,
  competition_code TEXT NOT NULL,
  competition_name TEXT,
  home_team_id INTEGER,
  home_team_name TEXT NOT NULL,
  home_team_crest TEXT,
  away_team_id INTEGER,
  away_team_name TEXT NOT NULL,
  away_team_crest TEXT,
  utc_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  matchday INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  winner TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cached_matches ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can read cached matches)
CREATE POLICY "Anyone can read cached matches" 
  ON public.cached_matches 
  FOR SELECT 
  USING (true);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_cached_matches_status ON public.cached_matches(status);
CREATE INDEX IF NOT EXISTS idx_cached_matches_utc_date ON public.cached_matches(utc_date);
CREATE INDEX IF NOT EXISTS idx_cached_matches_competition ON public.cached_matches(competition_code);
CREATE INDEX IF NOT EXISTS idx_cached_matches_date_status ON public.cached_matches(utc_date, status);