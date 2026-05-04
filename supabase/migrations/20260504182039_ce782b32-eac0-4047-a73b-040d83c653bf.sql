CREATE OR REPLACE FUNCTION public._streak_e2e_test()
RETURNS TABLE(test text, status text, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_user uuid := '00000000-0000-0000-0000-000000007777';
  result jsonb;
  rc int;
  pc int;
BEGIN
  -- Cleanup
  DELETE FROM premium_subscriptions WHERE user_id = test_user;
  DELETE FROM streak_rewards WHERE user_id = test_user;
  DELETE FROM user_streaks WHERE user_id = test_user;

  -- T1: streak=1 -> no rewards
  INSERT INTO user_streaks(user_id, current_streak, longest_streak, last_activity_date)
  VALUES (test_user, 1, 1, CURRENT_DATE);
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COUNT(*) INTO rc FROM streak_rewards WHERE user_id = test_user;
  RETURN QUERY SELECT 'T1 streak=1 → 0 rewards'::text, CASE WHEN rc=0 THEN 'PASS' ELSE 'FAIL' END, 'count='||rc;

  -- T2: streak=3 -> bonus_analysis
  UPDATE user_streaks SET current_streak=3, last_activity_date=CURRENT_DATE WHERE user_id = test_user;
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COUNT(*) INTO rc FROM streak_rewards WHERE user_id = test_user AND streak_day=3 AND reward_type='bonus_analysis';
  RETURN QUERY SELECT 'T2 streak=3 → bonus_analysis'::text, CASE WHEN rc=1 THEN 'PASS' ELSE 'FAIL' END, 'count='||rc;

  -- T3: idempotency
  PERFORM grant_streak_reward_for_user(test_user);
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COUNT(*) INTO rc FROM streak_rewards WHERE user_id = test_user AND streak_day=3;
  RETURN QUERY SELECT 'T3 idempotent re-run'::text, CASE WHEN rc=1 THEN 'PASS' ELSE 'FAIL' END, 'count='||rc;

  -- T4: streak=5
  UPDATE user_streaks SET current_streak=5, last_activity_date=CURRENT_DATE WHERE user_id = test_user;
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COUNT(*) INTO rc FROM streak_rewards WHERE user_id = test_user AND streak_day=5;
  RETURN QUERY SELECT 'T4 streak=5 → bonus_chat'::text, CASE WHEN rc=1 THEN 'PASS' ELSE 'FAIL' END, 'count='||rc;

  -- T5: streak=7 qty=2
  UPDATE user_streaks SET current_streak=7, last_activity_date=CURRENT_DATE WHERE user_id = test_user;
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COALESCE(SUM(quantity),0) INTO rc FROM streak_rewards WHERE user_id = test_user AND streak_day=7 AND reward_type='bonus_chat';
  RETURN QUERY SELECT 'T5 streak=7 → bonus_chat ×2'::text, CASE WHEN rc=2 THEN 'PASS' ELSE 'FAIL' END, 'qty='||rc;

  -- T6: streak=14
  UPDATE user_streaks SET current_streak=14, last_activity_date=CURRENT_DATE WHERE user_id = test_user;
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COUNT(*) INTO rc FROM streak_rewards WHERE user_id = test_user AND streak_day=14 AND reward_type='badge';
  RETURN QUERY SELECT 'T6a streak=14 → badge'::text, CASE WHEN rc=1 THEN 'PASS' ELSE 'FAIL' END, 'count='||rc;
  SELECT COALESCE(SUM(quantity),0) INTO rc FROM streak_rewards WHERE user_id = test_user AND streak_day=14 AND reward_type='bonus_chat';
  RETURN QUERY SELECT 'T6b streak=14 → bonus_chat ×3'::text, CASE WHEN rc=3 THEN 'PASS' ELSE 'FAIL' END, 'qty='||rc;

  -- T7: streak=30
  UPDATE user_streaks SET current_streak=30, last_activity_date=CURRENT_DATE WHERE user_id = test_user;
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COUNT(*) INTO rc FROM streak_rewards WHERE user_id = test_user AND reward_type='premium_trial';
  SELECT COUNT(*) INTO pc FROM premium_subscriptions WHERE user_id = test_user AND is_active=true AND platform='streak_reward';
  RETURN QUERY SELECT 'T7 streak=30 → premium_trial + sub'::text, CASE WHEN rc=1 AND pc=1 THEN 'PASS' ELSE 'FAIL' END, 'trial='||rc||' sub='||pc;

  -- T8: aggregated bonus_chat=6
  SELECT COALESCE(SUM(quantity),0) INTO rc FROM streak_rewards
  WHERE user_id=test_user AND reward_type='bonus_chat' AND NOT used;
  RETURN QUERY SELECT 'T8 total bonus_chat aggregate'::text, CASE WHEN rc=6 THEN 'PASS' ELSE 'FAIL' END, 'qty='||rc;

  -- T9: consume one bonus_analysis
  UPDATE streak_rewards SET used=true, used_at=now(), quantity=0
  WHERE id=(SELECT id FROM streak_rewards WHERE user_id=test_user AND reward_type='bonus_analysis' AND NOT used ORDER BY granted_at LIMIT 1);
  SELECT COALESCE(SUM(quantity),0) INTO rc FROM streak_rewards WHERE user_id=test_user AND reward_type='bonus_analysis' AND NOT used;
  RETURN QUERY SELECT 'T9 consume bonus_analysis'::text, CASE WHEN rc=0 THEN 'PASS' ELSE 'FAIL' END, 'remaining='||rc;

  -- T10: streak break + restart in new window re-grants day 3
  UPDATE streak_rewards SET granted_at = now() - interval '15 days' WHERE user_id=test_user;
  UPDATE user_streaks SET current_streak=3, last_activity_date=CURRENT_DATE WHERE user_id = test_user;
  PERFORM grant_streak_reward_for_user(test_user);
  SELECT COUNT(*) INTO rc FROM streak_rewards
  WHERE user_id=test_user AND streak_day=3 AND granted_at > now() - interval '1 minute';
  RETURN QUERY SELECT 'T10 new streak window re-grants'::text, CASE WHEN rc=1 THEN 'PASS' ELSE 'FAIL' END, 'count='||rc;

  -- T11: streak<3 returns []
  UPDATE user_streaks SET current_streak=2, last_activity_date=CURRENT_DATE WHERE user_id = test_user;
  result := grant_streak_reward_for_user(test_user);
  RETURN QUERY SELECT 'T11 streak=2 → []'::text, CASE WHEN result::text='[]' THEN 'PASS' ELSE 'FAIL' END, 'result='||result::text;

  -- Cleanup
  DELETE FROM premium_subscriptions WHERE user_id = test_user;
  DELETE FROM streak_rewards WHERE user_id = test_user;
  DELETE FROM user_streaks WHERE user_id = test_user;
END;
$$;