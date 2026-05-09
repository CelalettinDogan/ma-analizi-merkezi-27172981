-- Safety: prevent duplicate primary predictions per user/match/type
CREATE UNIQUE INDEX IF NOT EXISTS predictions_unique_primary_per_user_match
ON public.predictions (user_id, home_team, away_team, match_date, prediction_type)
WHERE is_primary = true;

-- Replace get_my_predictor_stats: add last-14-day rolling accuracy & sample
CREATE OR REPLACE FUNCTION public.get_my_predictor_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  total int;
  correct int;
  accuracy numeric;
  total_14d int;
  correct_14d int;
  accuracy_14d numeric;
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
  WHERE user_id = current_user_id
    AND is_primary = true
    AND is_correct IS NOT NULL;

  IF total > 0 THEN
    accuracy := ROUND((correct::numeric / total) * 100, 1);
  ELSE
    accuracy := NULL;
  END IF;

  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE is_correct = true)::int
  INTO total_14d, correct_14d
  FROM predictions
  WHERE user_id = current_user_id
    AND is_primary = true
    AND is_correct IS NOT NULL
    AND verified_at > now() - interval '14 days';

  IF total_14d > 0 THEN
    accuracy_14d := ROUND((correct_14d::numeric / total_14d) * 100, 1);
  ELSE
    accuracy_14d := NULL;
  END IF;

  result := jsonb_build_object(
    'total_predictions', (SELECT COUNT(*)::int FROM predictions WHERE user_id = current_user_id AND is_primary = true),
    'verified_predictions', total,
    'correct_predictions', correct,
    'accuracy', accuracy,
    'verified_predictions_14d', total_14d,
    'correct_predictions_14d', correct_14d,
    'accuracy_14d', accuracy_14d
  );
  RETURN result;
END;
$function$;