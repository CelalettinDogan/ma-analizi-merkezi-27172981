CREATE TABLE public.ml_model_weights (
  prediction_type text PRIMARY KEY,
  weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_names text[] NOT NULL DEFAULT '{}',
  feature_ranges jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  trained_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.ml_model_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ML weights are publicly readable"
ON public.ml_model_weights FOR SELECT
USING (true);

CREATE POLICY "Service role can manage ML weights"
ON public.ml_model_weights FOR ALL
USING (true)
WITH CHECK (true);