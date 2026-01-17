-- Create cached_live_matches table for rate-limit-free live match access
CREATE TABLE public.cached_live_matches (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL UNIQUE,
  competition_code TEXT NOT NULL,
  competition_name TEXT,
  home_team_id INTEGER,
  home_team_name TEXT NOT NULL,
  home_team_crest TEXT,
  away_team_id INTEGER,
  away_team_name TEXT NOT NULL,
  away_team_crest TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL,
  matchday INTEGER,
  utc_date TIMESTAMPTZ NOT NULL,
  minute TEXT,
  half_time_home INTEGER,
  half_time_away INTEGER,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for fast queries
CREATE INDEX idx_cached_live_matches_competition ON public.cached_live_matches(competition_code);
CREATE INDEX idx_cached_live_matches_status ON public.cached_live_matches(status);
CREATE INDEX idx_cached_live_matches_updated ON public.cached_live_matches(updated_at);

-- Enable RLS
ALTER TABLE public.cached_live_matches ENABLE ROW LEVEL SECURITY;

-- Allow public read access (live matches are public data)
CREATE POLICY "Allow public read access to cached_live_matches"
  ON public.cached_live_matches
  FOR SELECT
  TO public
  USING (true);

-- Allow service role full access for sync function
CREATE POLICY "Allow service role full access to cached_live_matches"
  ON public.cached_live_matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);