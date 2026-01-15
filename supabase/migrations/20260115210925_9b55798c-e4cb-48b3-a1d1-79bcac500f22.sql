-- Create match_history table for storing completed matches with pre-match statistics
CREATE TABLE public.match_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  -- Pre-match statistics (captured before the match)
  home_form TEXT,
  away_form TEXT,
  home_position INTEGER,
  away_position INTEGER,
  home_points INTEGER,
  away_points INTEGER,
  home_goals_scored INTEGER,
  home_goals_conceded INTEGER,
  away_goals_scored INTEGER,
  away_goals_conceded INTEGER,
  home_wins INTEGER,
  home_draws INTEGER,
  home_losses INTEGER,
  away_wins INTEGER,
  away_draws INTEGER,
  away_losses INTEGER,
  -- Calculated features for ML
  home_form_score DECIMAL(5,2),
  away_form_score DECIMAL(5,2),
  home_goal_avg DECIMAL(5,2),
  away_goal_avg DECIMAL(5,2),
  position_diff INTEGER,
  h2h_home_wins INTEGER DEFAULT 0,
  h2h_away_wins INTEGER DEFAULT 0,
  h2h_draws INTEGER DEFAULT 0,
  -- Match outcome classifications
  match_result TEXT, -- HOME_WIN, DRAW, AWAY_WIN
  total_goals INTEGER,
  both_teams_scored BOOLEAN,
  first_half_result TEXT,
  first_half_home_score INTEGER,
  first_half_away_score INTEGER
);

-- Create indexes for efficient querying
CREATE INDEX idx_match_history_league ON public.match_history(league);
CREATE INDEX idx_match_history_date ON public.match_history(match_date DESC);
CREATE INDEX idx_match_history_teams ON public.match_history(home_team, away_team);
CREATE INDEX idx_match_history_result ON public.match_history(match_result);

-- Enable RLS
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access for ML analysis
CREATE POLICY "Match history is publicly readable" 
ON public.match_history 
FOR SELECT 
USING (true);

-- Create prediction_features table to track features used for each prediction
CREATE TABLE public.prediction_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE,
  -- Input features
  home_form_score DECIMAL(5,2),
  away_form_score DECIMAL(5,2),
  home_goal_avg DECIMAL(5,2),
  away_goal_avg DECIMAL(5,2),
  position_diff INTEGER,
  home_advantage_score DECIMAL(5,2),
  h2h_home_wins INTEGER,
  h2h_away_wins INTEGER,
  h2h_draws INTEGER,
  expected_goals DECIMAL(5,2),
  -- AI analysis metadata
  ai_confidence DECIMAL(5,2),
  ai_reasoning TEXT,
  mathematical_confidence DECIMAL(5,2),
  hybrid_confidence DECIMAL(5,2),
  -- Learning feedback
  was_correct BOOLEAN,
  actual_result TEXT
);

-- Create indexes
CREATE INDEX idx_prediction_features_prediction ON public.prediction_features(prediction_id);
CREATE INDEX idx_prediction_features_correct ON public.prediction_features(was_correct);

-- Enable RLS
ALTER TABLE public.prediction_features ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Prediction features are publicly readable" 
ON public.prediction_features 
FOR SELECT 
USING (true);

-- Create ml_model_stats table to track model performance over time
CREATE TABLE public.ml_model_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prediction_type TEXT NOT NULL,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),
  avg_confidence DECIMAL(5,2),
  high_confidence_accuracy DECIMAL(5,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(prediction_type)
);

-- Enable RLS
ALTER TABLE public.ml_model_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "ML stats are publicly readable" 
ON public.ml_model_stats 
FOR SELECT 
USING (true);