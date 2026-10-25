CREATE TABLE public.app_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid,
  device_id text,
  event text NOT NULL CHECK (char_length(event) <= 48),
  props jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_events_event_time_idx ON public.app_events (event, created_at);
GRANT INSERT ON public.app_events TO anon, authenticated;
GRANT ALL ON public.app_events TO service_role;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert own events" ON public.app_events FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "admins read events" ON public.app_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.app_events TO authenticated;

CREATE OR REPLACE FUNCTION public.get_conversion_funnel(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE since timestamptz := now() - make_interval(days => LEAST(GREATEST(p_days,1),365));
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN jsonb_build_object(
    'installs', (SELECT count(DISTINCT device_id) FROM app_events WHERE event='app_open' AND created_at>=since),
    'signups', (SELECT count(*) FROM profiles WHERE created_at>=since),
    'first_analysis', (SELECT count(DISTINCT user_id) FROM app_events WHERE event='analysis_done' AND created_at>=since),
    'day2_return', (SELECT count(*) FROM (SELECT user_id FROM app_events WHERE user_id IS NOT NULL AND created_at>=since
                    GROUP BY user_id HAVING count(DISTINCT created_at::date) >= 2) t),
    'paywall_views', (SELECT count(DISTINCT coalesce(user_id::text, device_id)) FROM app_events WHERE event='paywall_view' AND created_at>=since),
    'purchase_start', (SELECT count(DISTINCT user_id) FROM app_events WHERE event='purchase_start' AND created_at>=since),
    'purchases', (SELECT count(DISTINCT user_id) FROM premium_subscriptions WHERE created_at>=since AND coalesce(platform,'')<>'streak_reward')
  );
END $$;
REVOKE EXECUTE ON FUNCTION public.get_conversion_funnel(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(integer) TO authenticated;

CREATE TABLE public.referral_codes (
  user_id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own code" ON public.referral_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.referrals (
  invitee_id uuid PRIMARY KEY,
  inviter_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE OR REPLACE FUNCTION public.get_my_referral()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); c text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT code INTO c FROM referral_codes WHERE user_id = uid;
  IF c IS NULL THEN
    LOOP
      c := upper(substr(md5(random()::text || uid::text), 1, 6));
      BEGIN INSERT INTO referral_codes(user_id, code) VALUES (uid, c); EXIT;
      EXCEPTION WHEN unique_violation THEN END;
    END LOOP;
  END IF;
  RETURN jsonb_build_object('code', c,
    'invited', (SELECT count(*) FROM referrals WHERE inviter_id = uid),
    'redeemed', EXISTS (SELECT 1 FROM referrals WHERE invitee_id = uid));
END $$;

CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); inviter uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT user_id INTO inviter FROM referral_codes WHERE code = upper(trim(p_code));
  IF inviter IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid'); END IF;
  IF inviter = uid THEN RETURN jsonb_build_object('ok', false, 'reason', 'self'); END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE invitee_id = uid) THEN RETURN jsonb_build_object('ok', false, 'reason', 'used'); END IF;
  IF (SELECT created_at FROM profiles WHERE user_id = uid) < now() - interval '7 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'too_old');
  END IF;
  INSERT INTO referrals(invitee_id, inviter_id) VALUES (uid, inviter);
  INSERT INTO streak_rewards(user_id, reward_type, streak_day, quantity, expires_at) VALUES
    (uid, 'bonus_analysis', 0, 2, now() + interval '30 days'),
    (inviter, 'bonus_analysis', 0, 2, now() + interval '30 days');
  RETURN jsonb_build_object('ok', true);
END $$;
REVOKE EXECUTE ON FUNCTION public.get_my_referral() FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_referral(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_referral() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_referral(text) TO authenticated;