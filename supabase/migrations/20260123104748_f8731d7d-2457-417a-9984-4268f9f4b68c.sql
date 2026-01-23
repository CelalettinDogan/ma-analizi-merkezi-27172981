-- Premium Subscriptions table for managing premium memberships
CREATE TABLE public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'yearly', 'trial')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for premium_subscriptions
CREATE INDEX idx_premium_user ON public.premium_subscriptions(user_id);
CREATE INDEX idx_premium_active ON public.premium_subscriptions(is_active, expires_at);

-- Enable RLS
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for premium_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.premium_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON public.premium_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chatbot Usage table for tracking daily usage limits
CREATE TABLE public.chatbot_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, usage_date)
);

-- Index for chatbot_usage
CREATE INDEX idx_chatbot_usage_user_date ON public.chatbot_usage(user_id, usage_date);

-- Enable RLS
ALTER TABLE public.chatbot_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_usage
CREATE POLICY "Users can view their own usage"
  ON public.chatbot_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage"
  ON public.chatbot_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat History table for storing conversation history
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for chat_history
CREATE INDEX idx_chat_history_user ON public.chat_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_history
CREATE POLICY "Users can view their own chat history"
  ON public.chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON public.chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all chat history"
  ON public.chat_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION public.is_premium_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.premium_subscriptions
    WHERE user_id = p_user_id
      AND is_active = true
      AND expires_at > now()
  )
$$;

-- Function to get daily usage count
CREATE OR REPLACE FUNCTION public.get_daily_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT usage_count 
     FROM public.chatbot_usage 
     WHERE user_id = p_user_id 
       AND usage_date = CURRENT_DATE),
    0
  )
$$;

-- Function to increment usage (called from edge function)
CREATE OR REPLACE FUNCTION public.increment_chatbot_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.chatbot_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = chatbot_usage.usage_count + 1,
    last_used_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- Trigger for updated_at on premium_subscriptions
CREATE TRIGGER update_premium_subscriptions_updated_at
  BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();