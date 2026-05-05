CREATE OR REPLACE FUNCTION public.grant_streak_reward_for_user(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec user_streaks%ROWTYPE;
  streak_start date;
  rewards_granted jsonb := '[]'::jsonb;
  milestone integer;
  milestones integer[] := ARRAY[3, 7, 14, 30];
  recent_chat_exists boolean;
BEGIN
  SELECT * INTO rec FROM user_streaks WHERE user_id = p_user_id;
  IF NOT FOUND OR rec.current_streak IS NULL OR rec.current_streak < 3 THEN
    RETURN '[]'::jsonb;
  END IF;

  streak_start := rec.last_activity_date - (rec.current_streak - 1);

  FOREACH milestone IN ARRAY milestones LOOP
    IF rec.current_streak >= milestone THEN
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
          WHEN 7 THEN
            -- 30-gün cooldown: son 30 gün içinde herhangi bir bonus_chat verilmiş mi?
            SELECT EXISTS (
              SELECT 1 FROM streak_rewards
              WHERE user_id = p_user_id
                AND reward_type = 'bonus_chat'
                AND granted_at > now() - interval '30 days'
            ) INTO recent_chat_exists;
            IF NOT recent_chat_exists THEN
              INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
              VALUES (p_user_id, 'bonus_chat', 7, 1);
              rewards_granted := rewards_granted || jsonb_build_object('day', 7, 'type', 'bonus_chat', 'quantity', 1);
            END IF;
          WHEN 14 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'badge', 14, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 14, 'type', 'badge', 'quantity', 1);
          WHEN 30 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (p_user_id, 'premium_trial', 30, 1);
            INSERT INTO premium_subscriptions (user_id, plan_type, starts_at, expires_at, is_active, platform)
            VALUES (p_user_id, 'trial', now(), now() + interval '1 day', true, 'streak_reward');
            rewards_granted := rewards_granted || jsonb_build_object('day', 30, 'type', 'premium_trial', 'quantity', 1);
        END CASE;
      END IF;
    END IF;
  END LOOP;

  RETURN rewards_granted;
END;
$function$;