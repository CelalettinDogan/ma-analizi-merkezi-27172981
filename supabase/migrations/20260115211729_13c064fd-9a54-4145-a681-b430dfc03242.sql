-- Add INSERT policies for tables that need data insertion

-- match_history INSERT policy (for edge function/service role)
CREATE POLICY "Allow insert for match history" 
ON public.match_history 
FOR INSERT 
WITH CHECK (true);

-- prediction_features INSERT policy
CREATE POLICY "Allow insert for prediction features" 
ON public.prediction_features 
FOR INSERT 
WITH CHECK (true);

-- ml_model_stats INSERT and UPDATE policies
CREATE POLICY "Allow insert for ml stats" 
ON public.ml_model_stats 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for ml stats" 
ON public.ml_model_stats 
FOR UPDATE 
USING (true);