-- Add hybrid_confidence and is_premium columns to predictions table
ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS hybrid_confidence numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Add premium-specific columns to ml_model_stats table
ALTER TABLE public.ml_model_stats
ADD COLUMN IF NOT EXISTS premium_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_correct integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_accuracy numeric DEFAULT 0;

-- Create index for premium predictions filtering
CREATE INDEX IF NOT EXISTS idx_predictions_is_premium 
ON public.predictions (is_premium) 
WHERE is_premium = true;

-- Create index for hybrid confidence filtering
CREATE INDEX IF NOT EXISTS idx_predictions_hybrid_confidence 
ON public.predictions (hybrid_confidence) 
WHERE hybrid_confidence IS NOT NULL;

-- Update existing predictions to calculate hybrid_confidence based on existing confidence
-- (This is a one-time migration to set sensible defaults)
UPDATE public.predictions
SET hybrid_confidence = CASE confidence
  WHEN 'yüksek' THEN 0.8
  WHEN 'orta' THEN 0.6
  WHEN 'düşük' THEN 0.4
  ELSE 0.5
END,
is_premium = CASE WHEN confidence = 'yüksek' THEN true ELSE false END
WHERE hybrid_confidence IS NULL;