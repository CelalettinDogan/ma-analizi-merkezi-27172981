-- Create cached_standings table for storing league standings
CREATE TABLE IF NOT EXISTS public.cached_standings (
  id SERIAL PRIMARY KEY,
  competition_code TEXT NOT NULL,
  competition_name TEXT,
  position INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  team_short_name TEXT,
  team_tla TEXT,
  team_crest TEXT,
  played_games INTEGER DEFAULT 0,
  form TEXT,
  won INTEGER DEFAULT 0,
  draw INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_code, team_id)
);

-- Enable RLS
ALTER TABLE public.cached_standings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read cached standings" 
  ON public.cached_standings 
  FOR SELECT 
  USING (true);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_cached_standings_competition ON public.cached_standings(competition_code);
CREATE INDEX IF NOT EXISTS idx_cached_standings_position ON public.cached_standings(competition_code, position);