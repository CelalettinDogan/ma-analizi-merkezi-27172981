
-- 1. Fix use_bonus_credit: add FOR UPDATE SKIP LOCKED to prevent double-spend
CREATE OR REPLACE FUNCTION public.use_bonus_credit(credit_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  reward_id uuid;
  current_qty integer;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF credit_type NOT IN ('bonus_analysis', 'bonus_chat') THEN
    RAISE EXCEPTION 'Invalid credit type';
  END IF;

  -- Advisory lock per user+type to serialize concurrent requests
  PERFORM pg_advisory_xact_lock(
    hashtext(current_user_id::text || credit_type)
  );

  -- Find oldest unused reward of this type with row lock
  SELECT id, quantity INTO reward_id, current_qty
  FROM streak_rewards
  WHERE user_id = current_user_id
    AND reward_type = credit_type
    AND NOT used
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY granted_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF reward_id IS NULL THEN
    RETURN false;
  END IF;

  IF current_qty <= 1 THEN
    UPDATE streak_rewards
    SET used = true, used_at = now(), quantity = 0
    WHERE id = reward_id;
  ELSE
    UPDATE streak_rewards
    SET quantity = current_qty - 1
    WHERE id = reward_id;
  END IF;

  RETURN true;
END;
$function$;

-- 2. Fix increment_chatbot_usage (no-arg version): advisory lock against double-tap
CREATE OR REPLACE FUNCTION public.increment_chatbot_usage()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Advisory lock per user per day to serialize concurrent increments
  PERFORM pg_advisory_xact_lock(
    hashtext(current_user_id::text || 'chat' || CURRENT_DATE::text)
  );

  INSERT INTO public.chatbot_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (current_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = chatbot_usage.usage_count + 1,
    last_used_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$function$;

-- 3. Fix increment_analysis_usage (no-arg version): advisory lock against double-tap
CREATE OR REPLACE FUNCTION public.increment_analysis_usage()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Advisory lock per user per day to serialize concurrent increments
  PERFORM pg_advisory_xact_lock(
    hashtext(current_user_id::text || 'analysis' || CURRENT_DATE::text)
  );

  INSERT INTO public.analysis_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (current_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = analysis_usage.usage_count + 1,
    last_used_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$function$;
