-- Create analysis_usage table for tracking daily match analysis limits
CREATE TABLE public.analysis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

-- Enable Row Level Security
ALTER TABLE public.analysis_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own analysis usage"
  ON public.analysis_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis usage"
  ON public.analysis_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis usage"
  ON public.analysis_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all analysis usage"
  ON public.analysis_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to get daily analysis usage
CREATE OR REPLACE FUNCTION public.get_daily_analysis_usage(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT usage_count 
     FROM public.analysis_usage 
     WHERE user_id = p_user_id 
       AND usage_date = CURRENT_DATE),
    0
  )
$$;

-- Function to increment analysis usage
CREATE OR REPLACE FUNCTION public.increment_analysis_usage(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.analysis_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = analysis_usage.usage_count + 1,
    last_used_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- Function to cleanup old analysis usage records
CREATE OR REPLACE FUNCTION public.cleanup_old_analysis_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM analysis_usage 
  WHERE usage_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$;