-- Fix RLS policies for premium_subscriptions - restrict to service_role only
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON premium_subscriptions;
CREATE POLICY "Service role can manage all subscriptions" 
  ON premium_subscriptions FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Fix RLS policies for chat_history - restrict service_role policy
DROP POLICY IF EXISTS "Service role can manage all chat history" ON chat_history;
CREATE POLICY "Service role can manage all chat history" 
  ON chat_history FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Fix RLS policies for chatbot_usage - restrict service_role policy
DROP POLICY IF EXISTS "Service role can manage all usage" ON chatbot_usage;
CREATE POLICY "Service role can manage all usage" 
  ON chatbot_usage FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Fix RLS policies for analysis_usage - restrict service_role policy
DROP POLICY IF EXISTS "Service role can manage all analysis usage" ON analysis_usage;
CREATE POLICY "Service role can manage all analysis usage" 
  ON analysis_usage FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);