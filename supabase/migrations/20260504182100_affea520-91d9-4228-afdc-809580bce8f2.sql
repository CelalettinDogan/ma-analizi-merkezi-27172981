ALTER TABLE public.premium_subscriptions DROP CONSTRAINT IF EXISTS premium_subscriptions_platform_check;
ALTER TABLE public.premium_subscriptions ADD CONSTRAINT premium_subscriptions_platform_check
  CHECK (platform = ANY (ARRAY['web'::text, 'android'::text, 'ios'::text, 'streak_reward'::text]));