
DROP POLICY IF EXISTS "Service role can manage cache" ON public.cached_ai_predictions;
CREATE POLICY "Service role can manage cache"
  ON public.cached_ai_predictions
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage chatbot cache" ON public.chatbot_cache;
CREATE POLICY "Service role can manage chatbot cache"
  ON public.chatbot_cache
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage analytics" ON public.admin_daily_analytics;
CREATE POLICY "Service role can manage analytics"
  ON public.admin_daily_analytics
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage ML weights" ON public.ml_model_weights;
CREATE POLICY "Service role can manage ML weights"
  ON public.ml_model_weights
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
