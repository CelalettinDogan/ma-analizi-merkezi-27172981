
-- admin_daily_analytics tablosu
CREATE TABLE public.admin_daily_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL UNIQUE,
  total_users integer NOT NULL DEFAULT 0,
  premium_users integer NOT NULL DEFAULT 0,
  premium_rate numeric NOT NULL DEFAULT 0,
  today_chats integer NOT NULL DEFAULT 0,
  today_analysis integer NOT NULL DEFAULT 0,
  ai_accuracy numeric NOT NULL DEFAULT 0,
  live_matches integer NOT NULL DEFAULT 0,
  active_users_24h integer NOT NULL DEFAULT 0,
  premium_by_plan jsonb DEFAULT '{}'::jsonb,
  premium_revenue numeric NOT NULL DEFAULT 0,
  prediction_stats jsonb DEFAULT '[]'::jsonb,
  league_stats jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.admin_daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read analytics"
  ON public.admin_daily_analytics
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage analytics"
  ON public.admin_daily_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexler
CREATE INDEX idx_admin_daily_analytics_date ON admin_daily_analytics(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_usage_date ON chatbot_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_analysis_usage_date ON analysis_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_predictions_primary_correct ON predictions(is_primary, is_correct) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_premium_subs_active ON premium_subscriptions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chatbot_usage_last_used ON chatbot_usage(last_used_at);
