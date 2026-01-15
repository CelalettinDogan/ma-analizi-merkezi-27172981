-- Fix security definer views by setting security_invoker
ALTER VIEW public.prediction_stats SET (security_invoker = on);
ALTER VIEW public.overall_stats SET (security_invoker = on);