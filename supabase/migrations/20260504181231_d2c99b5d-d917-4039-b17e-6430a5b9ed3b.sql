
-- Rewrite grant_streak_reward: per-streak-window dedup + premium_trial activation
CREATE OR REPLACE FUNCTION public.grant_streak_reward_for_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec user_streaks%ROWTYPE;
  streak_start date;
  rewards_granted jsonb := '[]'::jsonb;
  milestone integer;
  milestones integer[] := ARRAY[3, 5, 7, 14, 30];
BEGIN
  SELECT * INTO rec FROM user_streaks WHERE user_id = p_user_id;
  IF NOT FOUND OR rec.current_streak IS NULL OR rec.current_streak < 3 THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Beginning of current streak window
  streak_start := rec.last_activity_date - (rec.current_streak - 1);

  FOREACH milestone IN ARRAY milestones LOOP
    IF rec.current_streak >= milestone THEN
      -- Already granted within current streak window?
      IF NOT EXISTS (
        SELECT 1 FROM streak_rewards
        WHERE user_id = p_user_id
          AND streak_day = milestone
          AND granted_at::date >= streak_start
      ) THEN
        CASE milestone
          WHEN 3 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'bonus_analysis', 3, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 3, 'type', 'bonus_analysis', 'quantity', 1);
          WHEN 5 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'bonus_chat', 5, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 5, 'type', 'bonus_chat', 'quantity', 1);
          WHEN 7 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'bonus_chat', 7, 2);
            rewards_granted := rewards_granted || jsonb_build_object('day', 7, 'type', 'bonus_chat', 'quantity', 2);
          WHEN 14 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'bonus_chat', 14, 3);
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'badge', 14, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 14, 'type', 'bonus_chat+badge', 'quantity', 3);
          WHEN 30 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'premium_trial', 30, 1);
            -- Activate 1-day premium trial
            INSERT INTO premium_subscriptions (user_id, plan_type, starts_at, expires_at, is_active, platform)
            VALUES (p_user_id, 'trial', now(), now() + interval '1 day', true, 'streak_reward');
            rewards_granted := rewards_granted || jsonb_build_object('day', 30, 'type', 'premium_trial', 'quantity', 1);
        END CASE;
      END IF;
    END IF;
  END LOOP;

  RETURN rewards_granted;
END;
$$;

-- Public auth-context wrapper kept for backward compat
CREATE OR REPLACE FUNCTION public.grant_streak_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  RETURN public.grant_streak_reward_for_user(current_user_id);
END;
$$;

-- update_user_streak now auto-grants rewards
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  rec user_streaks%ROWTYPE;
  today date := CURRENT_DATE;
  granted jsonb;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO rec FROM user_streaks WHERE user_id = current_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (current_user_id, 1, 1, today)
    RETURNING * INTO rec;
  ELSIF rec.last_activity_date = today THEN
    NULL;
  ELSIF rec.last_activity_date = today - 1 THEN
    UPDATE user_streaks SET
      current_streak = rec.current_streak + 1,
      longest_streak = GREATEST(rec.longest_streak, rec.current_streak + 1),
      last_activity_date = today,
      streak_freeze_used = false
    WHERE user_id = current_user_id
    RETURNING * INTO rec;
  ELSIF rec.last_activity_date = today - 2 AND NOT rec.streak_freeze_used THEN
    UPDATE user_streaks SET
      current_streak = rec.current_streak + 1,
      longest_streak = GREATEST(rec.longest_streak, rec.current_streak + 1),
      last_activity_date = today,
      streak_freeze_used = true
    WHERE user_id = current_user_id
    RETURNING * INTO rec;
  ELSE
    UPDATE user_streaks SET
      current_streak = 1,
      last_activity_date = today,
      streak_freeze_used = false
    WHERE user_id = current_user_id
    RETURNING * INTO rec;
  END IF;

  -- Auto-grant any earned milestone rewards (idempotent per streak window)
  granted := public.grant_streak_reward_for_user(current_user_id);

  RETURN jsonb_build_object(
    'current_streak', rec.current_streak,
    'longest_streak', rec.longest_streak,
    'last_activity_date', rec.last_activity_date,
    'newly_granted', granted
  );
END;
$$;

-- One-time backfill: grant missing rewards to all current users with streaks >= 3
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT user_id FROM user_streaks WHERE current_streak >= 3 LOOP
    PERFORM public.grant_streak_reward_for_user(u.user_id);
  END LOOP;
END $$;
