-- Create predictions table to track all predictions
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Match info
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE NOT NULL,
  
  -- Prediction details
  prediction_type TEXT NOT NULL, -- 'match_result', 'total_goals', 'btts', 'correct_score', 'first_half'
  prediction_value TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('düşük', 'orta', 'yüksek')),
  reasoning TEXT,
  
  -- Actual result (filled after match)
  actual_result TEXT,
  is_correct BOOLEAN,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Match result details
  home_score INTEGER,
  away_score INTEGER
);

-- Create index for faster queries
CREATE INDEX idx_predictions_match_date ON public.predictions(match_date DESC);
CREATE INDEX idx_predictions_type ON public.predictions(prediction_type);
CREATE INDEX idx_predictions_is_correct ON public.predictions(is_correct);

-- Enable RLS but allow public read/write for now (no auth)
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo purposes
CREATE POLICY "Allow public read" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.predictions FOR UPDATE USING (true);

-- Create stats view for dashboard
CREATE OR REPLACE VIEW public.prediction_stats AS
SELECT 
  prediction_type,
  COUNT(*) as total_predictions,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_predictions,
  COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_predictions,
  COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as pending_predictions,
  ROUND(
    (COUNT(CASE WHEN is_correct = true THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(CASE WHEN is_correct IS NOT NULL THEN 1 END), 0) * 100), 1
  ) as accuracy_percentage
FROM public.predictions
GROUP BY prediction_type;

-- Overall stats view
CREATE OR REPLACE VIEW public.overall_stats AS
SELECT 
  COUNT(*) as total_predictions,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_predictions,
  COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_predictions,
  COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as pending_predictions,
  ROUND(
    (COUNT(CASE WHEN is_correct = true THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(CASE WHEN is_correct IS NOT NULL THEN 1 END), 0) * 100), 1
  ) as accuracy_percentage,
  COUNT(CASE WHEN confidence = 'yüksek' AND is_correct = true THEN 1 END) as high_confidence_correct,
  COUNT(CASE WHEN confidence = 'yüksek' AND is_correct IS NOT NULL THEN 1 END) as high_confidence_total
FROM public.predictions;