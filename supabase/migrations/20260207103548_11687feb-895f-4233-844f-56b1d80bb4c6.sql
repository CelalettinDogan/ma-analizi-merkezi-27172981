-- AI Prediction Cache Table
CREATE TABLE public.cached_ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_key TEXT UNIQUE NOT NULL,
  predictions JSONB NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '6 hours')
);

-- Indexes for performance
CREATE INDEX idx_cached_ai_match_key ON public.cached_ai_predictions(match_key);
CREATE INDEX idx_cached_ai_expires ON public.cached_ai_predictions(expires_at);

-- Enable RLS (public read, no user-specific data)
ALTER TABLE public.cached_ai_predictions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cache data is shared)
CREATE POLICY "Anyone can read cached predictions"
ON public.cached_ai_predictions FOR SELECT
USING (true);

-- Only service role can insert/update (from edge functions)
CREATE POLICY "Service role can manage cache"
ON public.cached_ai_predictions FOR ALL
USING (true)
WITH CHECK (true);

-- Chatbot Cache Table
CREATE TABLE public.chatbot_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour')
);

-- Indexes
CREATE INDEX idx_chatbot_cache_key ON public.chatbot_cache(cache_key);
CREATE INDEX idx_chatbot_cache_expires ON public.chatbot_cache(expires_at);

-- Enable RLS
ALTER TABLE public.chatbot_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read chatbot cache"
ON public.chatbot_cache FOR SELECT
USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage chatbot cache"
ON public.chatbot_cache FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_caches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ai_deleted INTEGER;
  chatbot_deleted INTEGER;
BEGIN
  DELETE FROM cached_ai_predictions WHERE expires_at < NOW();
  GET DIAGNOSTICS ai_deleted = ROW_COUNT;
  
  DELETE FROM chatbot_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS chatbot_deleted = ROW_COUNT;
  
  RAISE NOTICE 'Cleanup: % AI cache, % chatbot cache deleted', ai_deleted, chatbot_deleted;
END;
$$;