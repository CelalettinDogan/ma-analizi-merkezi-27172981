ALTER TABLE public.cached_standings ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE public.cached_standings ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE public.cached_matches ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE public.cached_matches ADD COLUMN IF NOT EXISTS group_name text;