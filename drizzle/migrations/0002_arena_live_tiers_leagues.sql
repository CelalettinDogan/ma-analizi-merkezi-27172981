DROP FUNCTION IF EXISTS public.arena_scored_picks(date);
CREATE FUNCTION public.arena_scored_picks(p_week date)
RETURNS TABLE(user_id uuid, match_id integer, points integer, settled boolean, live boolean, result_ok boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
WITH base AS (
  SELECT p.user_id, p.match_id, p.result_pick, p.ou_pick, p.joker, m.utc_date,
    (m.status = 'FINISHED' AND m.home_score IS NOT NULL) fin,
    (m.status <> 'FINISHED' AND l.status IN ('IN_PLAY','PAUSED','LIVE')) lv,
    CASE WHEN m.status = 'FINISHED' THEN m.home_score ELSE l.home_score END hs,
    CASE WHEN m.status = 'FINISHED' THEN m.away_score ELSE l.away_score END aws
  FROM arena_picks p JOIN cached_matches m ON m.match_id = p.match_id
  LEFT JOIN LATERAL (SELECT * FROM cached_live_matches cl WHERE cl.match_id = p.match_id ORDER BY cl.updated_at DESC NULLS LAST LIMIT 1) l ON true
  WHERE p.week_start = p_week
), res AS (
  SELECT b.*, CASE WHEN hs > aws THEN '1' WHEN hs < aws THEN '2' ELSE 'X' END actual,
    count(*) OVER (PARTITION BY b.match_id) total_n,
    count(*) OVER (PARTITION BY b.match_id, b.result_pick) same_n
  FROM base b
)
SELECT user_id, match_id,
  CASE WHEN NOT (fin OR COALESCE(lv,false)) OR hs IS NULL OR aws IS NULL THEN 0 ELSE
    ((CASE WHEN result_pick = actual THEN 3 ELSE 0 END)
     + (CASE WHEN ou_pick IS NOT NULL AND ((hs + aws) > 2.5) = (ou_pick = 'O') THEN 2 ELSE 0 END)
     + (CASE WHEN result_pick = actual AND total_n >= 4 AND same_n::numeric / total_n < 0.25 THEN 2 ELSE 0 END))
    * (CASE WHEN joker THEN 2 ELSE 1 END)
  END::integer,
  (fin OR utc_date < now() - interval '3 days'),
  COALESCE(lv, false),
  (fin AND result_pick = actual)
FROM res;
$$;

CREATE OR REPLACE FUNCTION public.get_arena_week()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); wk date := arena_week_start(0); prev date := arena_week_start(-1);
  ids integer[]; my_rank integer; reward jsonb := NULL;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  ids := arena_ensure_week(wk);
  IF NOT EXISTS (SELECT 1 FROM arena_rewards WHERE user_id = uid AND week_start = prev)
     AND EXISTS (SELECT 1 FROM arena_picks WHERE user_id = uid AND week_start = prev)
     AND NOT EXISTS (SELECT 1 FROM arena_scored_picks(prev) WHERE NOT settled) THEN
    SELECT r INTO my_rank FROM (
      SELECT s.user_id, rank() OVER (ORDER BY sum(points) DESC) r
      FROM arena_scored_picks(prev) s GROUP BY s.user_id HAVING sum(points) > 0
    ) t WHERE t.user_id = uid;
    IF my_rank IS NOT NULL AND my_rank <= 3 THEN
      INSERT INTO arena_rewards(user_id, week_start, rank) VALUES (uid, prev, my_rank) ON CONFLICT DO NOTHING;
      IF FOUND THEN
        INSERT INTO streak_rewards(user_id, reward_type, streak_day, quantity, expires_at)
        VALUES (uid, 'bonus_analysis', 0, 4 - my_rank, now() + interval '30 days'),
               (uid, 'bonus_chat', 0, 1, now() + interval '30 days');
        reward := jsonb_build_object('rank', my_rank, 'bonus_analysis', 4 - my_rank, 'bonus_chat', 1);
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'week_start', wk, 'ends_at', (wk + 7)::timestamptz,
    'participants', (SELECT count(DISTINCT user_id) FROM arena_picks WHERE week_start = wk),
    'reward', reward,
    'matches', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'match_id', m.match_id, 'competition_code', m.competition_code, 'competition_name', m.competition_name,
        'home', m.home_team_name, 'away', m.away_team_name, 'home_crest', m.home_team_crest, 'away_crest', m.away_team_crest,
        'utc_date', m.utc_date,
        'status', CASE WHEN m.status <> 'FINISHED' AND l.status IS NOT NULL THEN 'IN_PLAY' ELSE m.status END,
        'minute', l.minute,
        'home_score', CASE WHEN m.status = 'FINISHED' THEN m.home_score ELSE COALESCE(l.home_score, m.home_score) END,
        'away_score', CASE WHEN m.status = 'FINISHED' THEN m.away_score ELSE COALESCE(l.away_score, m.away_score) END,
        'pick', (SELECT jsonb_build_object('result', p.result_pick, 'ou', p.ou_pick, 'joker', p.joker)
                 FROM arena_picks p WHERE p.user_id = uid AND p.match_id = m.match_id),
        'points', (SELECT s.points FROM arena_scored_picks(wk) s WHERE s.user_id = uid AND s.match_id = m.match_id),
        'dist', (SELECT jsonb_build_object('n', count(*),
                   '1', count(*) FILTER (WHERE result_pick = '1'),
                   'X', count(*) FILTER (WHERE result_pick = 'X'),
                   '2', count(*) FILTER (WHERE result_pick = '2'))
                 FROM arena_picks d WHERE d.match_id = m.match_id AND d.week_start = wk)
      ) ORDER BY m.utc_date)
      FROM cached_matches m
      LEFT JOIN LATERAL (SELECT * FROM cached_live_matches cl WHERE cl.match_id = m.match_id AND cl.status IN ('IN_PLAY','PAUSED','LIVE') ORDER BY cl.updated_at DESC NULLS LAST LIMIT 1) l ON true
      WHERE m.match_id = ANY(ids)), '[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.arena_tier(p_total integer)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_total >= 200 THEN 'diamond' WHEN p_total >= 90 THEN 'gold' WHEN p_total >= 30 THEN 'silver' ELSE 'bronze' END
$$;

CREATE OR REPLACE FUNCTION public.get_arena_profile()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); total integer; streak integer := 0; w date; prev date := arena_week_start(-1);
  lw jsonb; badges text[] := '{}';
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  CREATE TEMP TABLE IF NOT EXISTS _ap(week_start date, match_id integer, points integer, settled boolean, result_ok boolean, joker boolean) ON COMMIT DROP;
  TRUNCATE _ap;
  INSERT INTO _ap SELECT aw.week_start, s.match_id, s.points, s.settled, s.result_ok, p.joker
    FROM arena_weeks aw CROSS JOIN LATERAL arena_scored_picks(aw.week_start) s
    JOIN arena_picks p ON p.user_id = s.user_id AND p.match_id = s.match_id AND p.week_start = aw.week_start
    WHERE s.user_id = uid;
  SELECT COALESCE(sum(points) FILTER (WHERE settled), 0) INTO total FROM _ap;

  w := arena_week_start(0);
  IF NOT EXISTS (SELECT 1 FROM arena_picks WHERE user_id = uid AND week_start = w) THEN w := prev; END IF;
  WHILE EXISTS (SELECT 1 FROM arena_picks WHERE user_id = uid AND week_start = w) LOOP
    streak := streak + 1; w := w - 7;
  END LOOP;

  WITH t AS (SELECT s.user_id, sum(s.points) pts FROM arena_scored_picks(prev) s GROUP BY 1),
       r AS (SELECT t.*, rank() OVER (ORDER BY pts DESC) rk FROM t)
  SELECT jsonb_build_object('points', pts, 'rank', rk, 'total', (SELECT count(*) FROM t)) INTO lw FROM r WHERE r.user_id = uid;

  IF EXISTS (SELECT 1 FROM _ap WHERE result_ok) THEN badges := badges || 'first_hit'; END IF;
  IF EXISTS (SELECT 1 FROM _ap WHERE result_ok AND joker) THEN badges := badges || 'joker_hit'; END IF;
  IF EXISTS (SELECT 1 FROM _ap GROUP BY week_start HAVING count(*) FILTER (WHERE result_ok) >= 5) THEN badges := badges || 'perfect_week'; END IF;
  IF streak >= 4 THEN badges := badges || 'streak_4'; END IF;
  IF EXISTS (SELECT 1 FROM arena_rewards WHERE user_id = uid) THEN badges := badges || 'podium'; END IF;

  RETURN jsonb_build_object('total', total, 'tier', arena_tier(total),
    'next', CASE WHEN total >= 200 THEN NULL WHEN total >= 90 THEN 200 WHEN total >= 30 THEN 90 ELSE 30 END,
    'streak', streak, 'last_week', lw, 'badges', to_jsonb(badges));
END $$;

CREATE TABLE public.arena_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 32),
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.arena_league_members (
  league_id uuid NOT NULL REFERENCES public.arena_leagues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (league_id, user_id)
);
GRANT SELECT ON public.arena_leagues TO authenticated;
GRANT SELECT ON public.arena_league_members TO authenticated;
GRANT ALL ON public.arena_leagues TO service_role;
GRANT ALL ON public.arena_league_members TO service_role;
ALTER TABLE public.arena_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_league_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own leagues" ON public.arena_leagues FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Members read own memberships" ON public.arena_league_members FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_arena_league(p_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); c text; lid uuid; nm text := btrim(p_name);
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF char_length(nm) < 2 OR char_length(nm) > 32 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF (SELECT count(*) FROM arena_leagues WHERE owner_id = uid) >= 5 THEN RAISE EXCEPTION 'too_many'; END IF;
  LOOP
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM arena_leagues WHERE code = c);
  END LOOP;
  INSERT INTO arena_leagues(code, name, owner_id) VALUES (c, nm, uid) RETURNING id INTO lid;
  INSERT INTO arena_league_members(league_id, user_id) VALUES (lid, uid);
  RETURN jsonb_build_object('id', lid, 'code', c);
END $$;

CREATE OR REPLACE FUNCTION public.join_arena_league(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); lid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO lid FROM arena_leagues WHERE code = upper(btrim(p_code));
  IF lid IS NULL THEN RAISE EXCEPTION 'invalid_code'; END IF;
  IF (SELECT count(*) FROM arena_league_members WHERE league_id = lid) >= 50 THEN RAISE EXCEPTION 'league_full'; END IF;
  IF (SELECT count(*) FROM arena_league_members WHERE user_id = uid) >= 10 THEN RAISE EXCEPTION 'too_many'; END IF;
  INSERT INTO arena_league_members(league_id, user_id) VALUES (lid, uid) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('id', lid);
END $$;

CREATE OR REPLACE FUNCTION public.leave_arena_league(p_league uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  DELETE FROM arena_league_members WHERE league_id = p_league AND user_id = auth.uid();
  DELETE FROM arena_leagues l WHERE l.id = p_league AND NOT EXISTS (SELECT 1 FROM arena_league_members m WHERE m.league_id = l.id);
END $$;

CREATE OR REPLACE FUNCTION public.get_my_arena_leagues()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'code', l.code, 'is_owner', l.owner_id = auth.uid(),
    'members', (SELECT count(*) FROM arena_league_members x WHERE x.league_id = l.id)) ORDER BY m.joined_at), '[]'::jsonb)
  FROM arena_league_members m JOIN arena_leagues l ON l.id = m.league_id WHERE m.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_arena_league_board(p_league uuid, p_scope text DEFAULT 'week')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); rows jsonb; me jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM arena_league_members WHERE league_id = p_league AND user_id = uid) THEN RAISE EXCEPTION 'not_member'; END IF;
  WITH mem AS (SELECT user_id FROM arena_league_members WHERE league_id = p_league),
  sc AS (
    SELECT s.user_id, s.points FROM arena_weeks w CROSS JOIN LATERAL arena_scored_picks(w.week_start) s
    WHERE p_scope = 'all' OR w.week_start = arena_week_start(0)
  ),
  agg AS (
    SELECT mem.user_id, COALESCE(sum(sc.points), 0)::int pts, count(sc.points) FILTER (WHERE sc.points > 0)::int correct
    FROM mem LEFT JOIN sc ON sc.user_id = mem.user_id GROUP BY mem.user_id
  ),
  r AS (SELECT agg.*, rank() OVER (ORDER BY pts DESC, correct DESC) rk, COALESCE(NULLIF(p.display_name,''), 'Oyuncu') name
        FROM agg LEFT JOIN profiles p ON p.user_id = agg.user_id)
  SELECT jsonb_agg(jsonb_build_object('rank', rk, 'name', name, 'points', pts, 'correct', correct, 'is_me', user_id = uid) ORDER BY rk),
         (SELECT jsonb_build_object('rank', rk, 'points', pts, 'total', (SELECT count(*) FROM r)) FROM r WHERE user_id = uid)
  INTO rows, me FROM r;
  RETURN jsonb_build_object('rows', COALESCE(rows, '[]'::jsonb), 'me', me);
END $$;

REVOKE EXECUTE ON FUNCTION public.arena_scored_picks(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.arena_scored_picks(date) TO authenticated, service_role;