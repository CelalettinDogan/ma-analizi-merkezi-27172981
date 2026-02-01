-- Fix 1: Create anonymized public view for predictions (excludes user_id and sensitive fields)
-- This allows public viewing of prediction stats without exposing user data

CREATE VIEW public.public_predictions WITH (security_invoker = true) AS
SELECT 
  id,
  league,
  home_team,
  away_team,
  match_date,
  prediction_type,
  prediction_value,
  confidence,
  is_correct,
  is_premium,
  is_primary,
  home_score,
  away_score,
  actual_result,
  created_at,
  verified_at
FROM public.predictions
WHERE is_primary = true;

-- Update predictions table RLS: users can only see their own predictions directly
DROP POLICY IF EXISTS "Anyone can view predictions" ON public.predictions;

CREATE POLICY "Users can view their own predictions"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix 2: Replace RPC functions to use auth.uid() internally instead of accepting user_id parameter
-- This prevents users from accessing other users' data

-- 2a: Fix get_daily_analysis_usage - remove parameter, use auth.uid()
CREATE OR REPLACE FUNCTION public.get_daily_analysis_usage()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN COALESCE(
    (SELECT usage_count 
     FROM public.analysis_usage 
     WHERE user_id = current_user_id
       AND usage_date = CURRENT_DATE),
    0
  );
END;
$$;

-- 2b: Fix increment_analysis_usage - remove parameter, use auth.uid()
CREATE OR REPLACE FUNCTION public.increment_analysis_usage()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  INSERT INTO public.analysis_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (current_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = analysis_usage.usage_count + 1,
    last_used_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- 2c: Fix get_daily_usage (chatbot) - remove parameter, use auth.uid()
CREATE OR REPLACE FUNCTION public.get_daily_usage()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN COALESCE(
    (SELECT usage_count 
     FROM public.chatbot_usage 
     WHERE user_id = current_user_id
       AND usage_date = CURRENT_DATE),
    0
  );
END;
$$;

-- 2d: Fix increment_chatbot_usage - remove parameter, use auth.uid()
CREATE OR REPLACE FUNCTION public.increment_chatbot_usage()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  INSERT INTO public.chatbot_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (current_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = chatbot_usage.usage_count + 1,
    last_used_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- 2e: Fix is_premium_user - remove parameter, use auth.uid()
CREATE OR REPLACE FUNCTION public.is_premium_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.premium_subscriptions
    WHERE user_id = current_user_id
      AND is_active = true
      AND expires_at > now()
  );
END;
$$;