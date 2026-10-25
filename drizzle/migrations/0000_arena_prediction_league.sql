CREATE TABLE public.arena_weeks (
  week_start date PRIMARY KEY,
  match_ids integer[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.arena_weeks TO authenticated;
GRANT ALL ON public.arena_weeks TO service_role;
ALTER TABLE public.arena_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arena weeks readable" ON public.arena_weeks FOR SELECT TO authenticated USING (true);

CREATE TABLE public.arena_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  match_id integer NOT NULL,
  result_pick text NOT NULL CHECK (result_pick IN ('1','X','2')),
  ou_pick text CHECK (ou_pick IN ('O','U')),
  joker boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);
CREATE INDEX arena_picks_week_idx ON public.arena_picks (week_start, match_id);
GRANT SELECT ON public.arena_picks TO authenticated;
GRANT ALL ON public.arena_picks TO service_role;
ALTER TABLE public.arena_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own arena picks" ON public.arena_picks FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.arena_rewards (
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  rank integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);
GRANT SELECT ON public.arena_rewards TO authenticated;
GRANT ALL ON public.arena_rewards TO service_role;
ALTER TABLE public.arena_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own arena rewards" ON public.arena_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Ensure a week's 5 featured matches exist
CREATE OR REPLACE FUNCTION public.arena_ensure_week(p_week date)
RETURNS integer[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ids integer[];
BEGIN
  SELECT match_ids INTO ids FROM arena_weeks WHERE week_start = p_week;
  IF ids IS NOT NULL AND array_length(ids,1) >= 5 THEN RETURN ids; END IF;
  SELECT array_agg(match_id) INTO ids FROM (
    SELECT match_id FROM cached_matches
    WHERE utc_date >= p_week::timestamptz AND utc_date < (p_week + 7)::timestamptz
      AND (ids IS NULL OR NOT (match_id = ANY(ids)))
    ORDER BY (utc_date > now()) DESC,
      CASE competition_code WHEN 'CL' THEN 1 WHEN 'PL' THEN 2 WHEN 'PD' THEN 3 WHEN 'SA' THEN 4 WHEN 'BL1' THEN 5 WHEN 'FL1' THEN 6 ELSE 9 END,
      utc_date
    LIMIT 5 - COALESCE(array_length(ids,1),0)
  ) s;
  ids := COALESCE((SELECT match_ids FROM arena_weeks WHERE week_start = p_week), '{}') || COALESCE(ids,'{}');
  INSERT INTO arena_weeks(week_start, match_ids) VALUES (p_week, ids)
  ON CONFLICT (week_start) DO UPDATE SET match_ids = EXCLUDED.match_ids;
  RETURN ids;
END $$;

-- Scored picks for a week (points per pick)
CREATE OR REPLACE FUNCTION public.arena_scored_picks(p_week date)
RETURNS TABLE(user_id uuid, match_id integer, points integer, settled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH res AS (
    SELECT p.*, m.home_score hs, m.away_score aws, (m.status = 'FINISHED' AND m.home_score IS NOT NULL) fin,
      CASE WHEN m.home_score > m.away_score THEN '1' WHEN m.home_score < m.away_score THEN '2' ELSE 'X' END actual,
      count(*) OVER (PARTITION BY p.match_id) total_n,
      count(*) OVER (PARTITION BY p.match_id, p.result_pick) same_n
    FROM arena_picks p JOIN cached_matches m ON m.match_id = p.match_id
    WHERE p.week_start = p_week
  )
  SELECT user_id, match_id,
    CASE WHEN NOT fin THEN 0 ELSE
      ((CASE WHEN result_pick = actual THEN 3 ELSE 0 END)
       + (CASE WHEN ou_pick IS NOT NULL AND ((hs+aws) > 2.5) = (ou_pick = 'O') THEN 2 ELSE 0 END)
       + (CASE WHEN result_pick = actual AND total_n >= 4 AND same_n::numeric / total_n < 0.25 THEN 2 ELSE 0 END))
      * (CASE WHEN joker THEN 2 ELSE 1 END)
    END::integer, fin
  FROM res;
$$;
REVOKE ALL ON FUNCTION public.arena_scored_picks(date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_ensure_week(date) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.arena_week_start(p_offset integer DEFAULT 0)
RETURNS date LANGUAGE sql STABLE AS $$ SELECT (date_trunc('week', now() AT TIME ZONE 'UTC'))::date + (p_offset * 7) $$;

-- Main read: week matches + my picks + my points + participants + grant last week's reward
CREATE OR REPLACE FUNCTION public.get_arena_week()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); wk date := arena_week_start(0); prev date := arena_week_start(-1);
  ids integer[]; my_rank integer; reward jsonb := NULL;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  ids := arena_ensure_week(wk);

  -- lazy reward for last week top 3 (only when every match settled)
  IF NOT EXISTS (SELECT 1 FROM arena_rewards WHERE user_id = uid AND week_start = prev)
     AND EXISTS (SELECT 1 FROM arena_picks WHERE user_id = uid AND week_start = prev)
     AND NOT EXISTS (SELECT 1 FROM arena_scored_picks(prev) WHERE NOT settled) THEN
    SELECT r INTO my_rank FROM (
      SELECT s.user_id, rank() OVER (ORDER BY sum(points) DESC) r
      FROM arena_scored_picks(prev) s GROUP BY s.user_id HAVING sum(points) > 0
    ) t WHERE t.user_id = uid;
    IF my_rank IS NOT NULL AND my_rank <= 3 THEN
      INSERT INTO arena_rewards(user_id, week_start, rank) VALUES (uid, prev, my_rank);
      INSERT INTO streak_rewards(user_id, reward_type, streak_day, quantity, expires_at)
      VALUES (uid, 'bonus_analysis', 0, 4 - my_rank, now() + interval '30 days'),
             (uid, 'bonus_chat', 0, 1, now() + interval '30 days');
      reward := jsonb_build_object('rank', my_rank, 'bonus_analysis', 4 - my_rank, 'bonus_chat', 1);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'week_start', wk,
    'ends_at', (wk + 7)::timestamptz,
    'participants', (SELECT count(DISTINCT user_id) FROM arena_picks WHERE week_start = wk),
    'reward', reward,
    'matches', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'match_id', m.match_id, 'competition_code', m.competition_code, 'competition_name', m.competition_name,
        'home', m.home_team_name, 'away', m.away_team_name, 'home_crest', m.home_team_crest, 'away_crest', m.away_team_crest,
        'utc_date', m.utc_date, 'status', m.status, 'home_score', m.home_score, 'away_score', m.away_score,
        'pick', (SELECT jsonb_build_object('result', p.result_pick, 'ou', p.ou_pick, 'joker', p.joker)
                 FROM arena_picks p WHERE p.user_id = uid AND p.match_id = m.match_id),
        'points', (SELECT s.points FROM arena_scored_picks(wk) s WHERE s.user_id = uid AND s.match_id = m.match_id)
      ) ORDER BY m.utc_date) FROM cached_matches m WHERE m.match_id = ANY(ids)), '[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.submit_arena_pick(p_match_id integer, p_result text, p_ou text, p_joker boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); wk date := arena_week_start(0); kickoff timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_result NOT IN ('1','X','2') OR (p_ou IS NOT NULL AND p_ou NOT IN ('O','U')) THEN RAISE EXCEPTION 'invalid pick'; END IF;
  IF NOT (p_match_id = ANY(arena_ensure_week(wk))) THEN RAISE EXCEPTION 'match not in arena'; END IF;
  SELECT utc_date INTO kickoff FROM cached_matches WHERE match_id = p_match_id;
  IF kickoff IS NULL OR kickoff <= now() THEN RAISE EXCEPTION 'locked'; END IF;
  IF p_joker THEN
    IF NOT (is_premium_user() OR has_role(uid, 'admin')) THEN RAISE EXCEPTION 'premium_required'; END IF;
    UPDATE arena_picks SET joker = false WHERE user_id = uid AND week_start = wk AND match_id <> p_match_id
      AND (SELECT utc_date FROM cached_matches c WHERE c.match_id = arena_picks.match_id) > now();
    IF EXISTS (SELECT 1 FROM arena_picks a JOIN cached_matches c ON c.match_id = a.match_id
               WHERE a.user_id = uid AND a.week_start = wk AND a.joker AND a.match_id <> p_match_id) THEN
      RAISE EXCEPTION 'joker_used';
    END IF;
  END IF;
  INSERT INTO arena_picks(user_id, week_start, match_id, result_pick, ou_pick, joker)
  VALUES (uid, wk, p_match_id, p_result, p_ou, COALESCE(p_joker,false))
  ON CONFLICT (user_id, match_id) DO UPDATE SET result_pick = EXCLUDED.result_pick, ou_pick = EXCLUDED.ou_pick,
    joker = EXCLUDED.joker, updated_at = now();
  PERFORM update_user_streak();
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.get_arena_leaderboard(p_scope text DEFAULT 'week')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); rows jsonb; me jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  CREATE TEMP TABLE IF NOT EXISTS _lb(user_id uuid, pts integer, correct integer) ON COMMIT DROP;
  TRUNCATE _lb;
  IF p_scope = 'all' THEN
    INSERT INTO _lb SELECT s.user_id, sum(s.points), count(*) FILTER (WHERE s.points > 0)
      FROM arena_weeks w CROSS JOIN LATERAL arena_scored_picks(w.week_start) s GROUP BY s.user_id;
  ELSE
    INSERT INTO _lb SELECT s.user_id, sum(s.points), count(*) FILTER (WHERE s.points > 0)
      FROM arena_scored_picks(arena_week_start(0)) s GROUP BY s.user_id;
  END IF;
  WITH r AS (
    SELECT l.*, rank() OVER (ORDER BY pts DESC, correct DESC) rk,
      COALESCE(NULLIF(p.display_name,''), 'Oyuncu') AS name
    FROM _lb l LEFT JOIN profiles p ON p.user_id = l.user_id
  )
  SELECT jsonb_agg(jsonb_build_object('rank', rk, 'name', name, 'points', pts, 'correct', correct, 'is_me', user_id = uid) ORDER BY rk)
    INTO rows FROM (SELECT * FROM r ORDER BY rk LIMIT 20) t;
  WITH r AS (SELECT l.*, rank() OVER (ORDER BY pts DESC, correct DESC) rk FROM _lb l)
  SELECT jsonb_build_object('rank', rk, 'points', pts, 'total', (SELECT count(*) FROM _lb)) INTO me FROM r WHERE user_id = uid;
  RETURN jsonb_build_object('rows', COALESCE(rows,'[]'::jsonb), 'me', me);
END $$;

GRANT EXECUTE ON FUNCTION public.get_arena_week() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_arena_pick(integer, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_arena_leaderboard(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_arena_week() FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_arena_pick(integer, text, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_arena_leaderboard(text) FROM anon;