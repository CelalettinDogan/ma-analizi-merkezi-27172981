
-- User streaks table
CREATE TABLE public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  streak_freeze_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON public.user_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak" ON public.user_streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak" ON public.user_streaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: update streak on activity
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
  result jsonb;
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
    -- Already counted today, no-op
    NULL;
  ELSIF rec.last_activity_date = today - 1 THEN
    -- Consecutive day
    UPDATE user_streaks SET
      current_streak = rec.current_streak + 1,
      longest_streak = GREATEST(rec.longest_streak, rec.current_streak + 1),
      last_activity_date = today,
      streak_freeze_used = false
    WHERE user_id = current_user_id
    RETURNING * INTO rec;
  ELSIF rec.last_activity_date = today - 2 AND NOT rec.streak_freeze_used THEN
    -- One day gap, use freeze
    UPDATE user_streaks SET
      current_streak = rec.current_streak + 1,
      longest_streak = GREATEST(rec.longest_streak, rec.current_streak + 1),
      last_activity_date = today,
      streak_freeze_used = true
    WHERE user_id = current_user_id
    RETURNING * INTO rec;
  ELSE
    -- Streak broken
    UPDATE user_streaks SET
      current_streak = 1,
      last_activity_date = today,
      streak_freeze_used = false
    WHERE user_id = current_user_id
    RETURNING * INTO rec;
  END IF;

  result := jsonb_build_object(
    'current_streak', rec.current_streak,
    'longest_streak', rec.longest_streak,
    'last_activity_date', rec.last_activity_date
  );
  RETURN result;
END;
$$;

-- RPC: get predictor stats for current user
CREATE OR REPLACE FUNCTION public.get_my_predictor_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  total int;
  correct int;
  accuracy numeric;
  result jsonb;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE is_correct = true)::int
  INTO total, correct
  FROM predictions
  WHERE user_id = current_user_id AND is_correct IS NOT NULL;

  IF total > 0 THEN
    accuracy := ROUND((correct::numeric / total) * 100, 1);
  ELSE
    accuracy := NULL;
  END IF;

  result := jsonb_build_object(
    'total_predictions', (SELECT COUNT(*)::int FROM predictions WHERE user_id = current_user_id),
    'verified_predictions', total,
    'correct_predictions', correct,
    'accuracy', accuracy
  );
  RETURN result;
END;
$$;
