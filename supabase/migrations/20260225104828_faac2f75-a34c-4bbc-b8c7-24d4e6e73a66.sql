
-- prediction_features: AI ve Matematik tahmin değerleri ve ayrı doğruluk kolonları
ALTER TABLE public.prediction_features
  ADD COLUMN IF NOT EXISTS ai_prediction_value TEXT,
  ADD COLUMN IF NOT EXISTS math_prediction_value TEXT,
  ADD COLUMN IF NOT EXISTS ai_was_correct BOOLEAN,
  ADD COLUMN IF NOT EXISTS math_was_correct BOOLEAN;

-- ml_model_stats: AI ve Matematik ayrı sayaçlar
ALTER TABLE public.ml_model_stats
  ADD COLUMN IF NOT EXISTS ai_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_correct INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_accuracy NUMERIC,
  ADD COLUMN IF NOT EXISTS math_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS math_correct INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS math_accuracy NUMERIC;
