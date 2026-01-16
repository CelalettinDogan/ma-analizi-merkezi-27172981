-- 1. Remove overly permissive RLS policy for prediction_features
DROP POLICY IF EXISTS "Allow insert for prediction features" ON public.prediction_features;

-- 2. Seed initial ML model stats for the learning loop to work
INSERT INTO public.ml_model_stats (prediction_type, total_predictions, correct_predictions, accuracy_percentage)
VALUES 
  ('Maç Sonucu', 0, 0, 50),
  ('Toplam Gol Alt/Üst', 0, 0, 50),
  ('Karşılıklı Gol', 0, 0, 50),
  ('Doğru Skor', 0, 0, 10),
  ('İlk Yarı Sonucu', 0, 0, 40)
ON CONFLICT (prediction_type) DO NOTHING;