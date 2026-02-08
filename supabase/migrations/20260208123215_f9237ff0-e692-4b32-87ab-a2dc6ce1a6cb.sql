-- 1. Add INSERT policy for prediction_features table (ML learning loop fix)
CREATE POLICY "Users can insert prediction features"
ON public.prediction_features
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM predictions p 
    WHERE p.id = prediction_id 
    AND p.user_id = auth.uid()
  )
);

-- 2. Clean up orphan predictions with NULL user_id
DELETE FROM predictions WHERE user_id IS NULL;