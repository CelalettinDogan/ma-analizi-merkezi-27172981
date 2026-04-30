
-- Streak rewards table
CREATE TABLE public.streak_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reward_type text NOT NULL, -- 'bonus_analysis', 'bonus_chat', 'premium_trial', 'badge'
  streak_day integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON public.streak_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all rewards"
  ON public.streak_rewards FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_streak_rewards_user ON public.streak_rewards(user_id);
CREATE INDEX idx_streak_rewards_unused ON public.streak_rewards(user_id, reward_type, used) WHERE NOT used;

-- Grant streak reward RPC
CREATE OR REPLACE FUNCTION public.grant_streak_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  streak_count integer;
  rewards_granted jsonb := '[]'::jsonb;
  milestone integer;
  milestones integer[] := ARRAY[3, 5, 7, 14, 30];
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current streak
  SELECT current_streak INTO streak_count
  FROM user_streaks WHERE user_id = current_user_id;

  IF streak_count IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  FOREACH milestone IN ARRAY milestones LOOP
    IF streak_count >= milestone THEN
      -- Check if already granted for this milestone in this streak period
      IF NOT EXISTS (
        SELECT 1 FROM streak_rewards
        WHERE user_id = current_user_id
          AND streak_day = milestone
          AND granted_at > now() - interval '30 days'
      ) THEN
        CASE milestone
          WHEN 3 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (current_user_id, 'bonus_analysis', 3, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 3, 'type', 'bonus_analysis', 'quantity', 1);
          WHEN 5 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (current_user_id, 'bonus_chat', 5, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 5, 'type', 'bonus_chat', 'quantity', 1);
          WHEN 7 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (current_user_id, 'bonus_chat', 7, 2);
            rewards_granted := rewards_granted || jsonb_build_object('day', 7, 'type', 'bonus_chat', 'quantity', 2);
          WHEN 14 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (current_user_id, 'bonus_chat', 14, 3);
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (current_user_id, 'badge', 14, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 14, 'type', 'bonus_chat+badge', 'quantity', 3);
          WHEN 30 THEN
            INSERT INTO streak_rewards (user_id, reward_type, streak_day, quantity)
            VALUES (current_user_id, 'premium_trial', 30, 1);
            rewards_granted := rewards_granted || jsonb_build_object('day', 30, 'type', 'premium_trial', 'quantity', 1);
        END CASE;
      END IF;
    END IF;
  END LOOP;

  RETURN rewards_granted;
END;
$$;

-- Get bonus credits RPC
CREATE OR REPLACE FUNCTION public.get_bonus_credits()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  bonus_analysis integer;
  bonus_chat integer;
  has_badge boolean;
  result jsonb;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('bonus_analysis', 0, 'bonus_chat', 0, 'has_streak_badge', false);
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO bonus_analysis
  FROM streak_rewards
  WHERE user_id = current_user_id
    AND reward_type = 'bonus_analysis'
    AND NOT used
    AND (expires_at IS NULL OR expires_at > now());

  SELECT COALESCE(SUM(quantity), 0) INTO bonus_chat
  FROM streak_rewards
  WHERE user_id = current_user_id
    AND reward_type = 'bonus_chat'
    AND NOT used
    AND (expires_at IS NULL OR expires_at > now());

  SELECT EXISTS (
    SELECT 1 FROM streak_rewards
    WHERE user_id = current_user_id
      AND reward_type = 'badge'
      AND streak_day >= 14
  ) INTO has_badge;

  result := jsonb_build_object(
    'bonus_analysis', bonus_analysis,
    'bonus_chat', bonus_chat,
    'has_streak_badge', has_badge
  );
  RETURN result;
END;
$$;

-- Use bonus credit RPC
CREATE OR REPLACE FUNCTION public.use_bonus_credit(credit_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  reward_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF credit_type NOT IN ('bonus_analysis', 'bonus_chat') THEN
    RAISE EXCEPTION 'Invalid credit type';
  END IF;

  -- Find oldest unused reward of this type
  SELECT id INTO reward_id
  FROM streak_rewards
  WHERE user_id = current_user_id
    AND reward_type = credit_type
    AND NOT used
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY granted_at ASC
  LIMIT 1;

  IF reward_id IS NULL THEN
    RETURN false;
  END IF;

  -- Mark quantity-1; if quantity=1, mark as used
  UPDATE streak_rewards
  SET quantity = CASE WHEN quantity > 1 THEN quantity - 1 ELSE quantity END,
      used = CASE WHEN quantity <= 1 THEN true ELSE false END,
      used_at = CASE WHEN quantity <= 1 THEN now() ELSE used_at END
  WHERE id = reward_id;

  RETURN true;
END;
$$;
