ALTER TABLE public.arena_rewards ADD COLUMN claimed_at timestamptz DEFAULT now();
COMMENT ON COLUMN public.arena_rewards.claimed_at IS 'NULL means pending indefinitely; a timestamp means credits were granted exactly once.';
CREATE INDEX arena_rewards_pending_user_idx ON public.arena_rewards(user_id, week_start) WHERE claimed_at IS NULL;

CREATE OR REPLACE FUNCTION public.arena_save_pending_rewards()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE w date;
BEGIN
  FOR w IN SELECT week_start FROM public.arena_weeks WHERE week_start < public.arena_week_start(0) ORDER BY week_start LOOP
    IF EXISTS (SELECT 1 FROM public.arena_scored_picks(w))
       AND NOT EXISTS (SELECT 1 FROM public.arena_scored_picks(w) WHERE NOT settled) THEN
      INSERT INTO public.arena_rewards(user_id, week_start, rank, claimed_at)
      SELECT ranked.user_id, w, ranked.rk::integer, NULL
      FROM (
        SELECT s.user_id, rank() OVER (ORDER BY sum(s.points) DESC) rk
        FROM public.arena_scored_picks(w) s GROUP BY s.user_id HAVING sum(s.points) > 0
      ) ranked WHERE ranked.rk <= 3
      ON CONFLICT (user_id, week_start) DO NOTHING;
    END IF;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.arena_save_pending_rewards() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arena_save_pending_rewards() TO service_role;

CREATE OR REPLACE FUNCTION public.get_arena_week()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); wk date := arena_week_start(0);
  ids integer[]; pending record; rewards jsonb := '[]'::jsonb; reward jsonb := NULL;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('arena-rewards:' || uid::text, 0));
  PERFORM public.arena_save_pending_rewards();
  FOR pending IN
    SELECT week_start, rank FROM public.arena_rewards
    WHERE user_id = uid AND claimed_at IS NULL ORDER BY week_start FOR UPDATE
  LOOP
    INSERT INTO public.streak_rewards(user_id, reward_type, streak_day, quantity, expires_at)
    VALUES (uid, 'bonus_analysis', 0, 4 - pending.rank, now() + interval '30 days'),
           (uid, 'bonus_chat', 0, 1, now() + interval '30 days');
    UPDATE public.arena_rewards SET claimed_at = now()
      WHERE user_id = uid AND week_start = pending.week_start AND claimed_at IS NULL;
    rewards := rewards || jsonb_build_array(jsonb_build_object(
      'week_start', pending.week_start, 'rank', pending.rank,
      'bonus_analysis', 4 - pending.rank, 'bonus_chat', 1));
  END LOOP;
  IF jsonb_array_length(rewards) > 0 THEN reward := rewards -> 0; END IF;
  ids := arena_ensure_week(wk);
  RETURN jsonb_build_object(
    'week_start', wk, 'ends_at', (wk + 7)::timestamptz,
    'participants', (SELECT count(DISTINCT user_id) FROM arena_picks WHERE week_start = wk),
    'reward', reward, 'rewards', rewards,
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
SELECT cron.schedule('arena-save-pending-rewards', '0 * * * *', 'SELECT public.arena_save_pending_rewards()');