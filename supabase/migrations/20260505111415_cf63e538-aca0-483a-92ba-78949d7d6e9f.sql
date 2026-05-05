CREATE OR REPLACE FUNCTION public.use_bonus_credit_for_user(p_user_id uuid, credit_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reward_id uuid;
  current_qty integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;
  IF credit_type NOT IN ('bonus_analysis', 'bonus_chat') THEN
    RAISE EXCEPTION 'Invalid credit type';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text || credit_type));

  SELECT id, quantity INTO reward_id, current_qty
  FROM streak_rewards
  WHERE user_id = p_user_id
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
    UPDATE streak_rewards SET used = true, used_at = now(), quantity = 0 WHERE id = reward_id;
  ELSE
    UPDATE streak_rewards SET quantity = current_qty - 1 WHERE id = reward_id;
  END IF;

  RETURN true;
END;
$function$;