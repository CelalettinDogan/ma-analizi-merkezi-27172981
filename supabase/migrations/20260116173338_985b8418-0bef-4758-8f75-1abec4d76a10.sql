-- Drop overly permissive INSERT/UPDATE policies on match_history and ml_model_stats
-- These tables should only be written to by Edge Functions using service_role key

-- match_history: Remove the permissive INSERT policy
DROP POLICY IF EXISTS "Allow insert for match history" ON public.match_history;

-- ml_model_stats: Remove the permissive INSERT and UPDATE policies
DROP POLICY IF EXISTS "Allow insert for ml stats" ON public.ml_model_stats;
DROP POLICY IF EXISTS "Allow update for ml stats" ON public.ml_model_stats;