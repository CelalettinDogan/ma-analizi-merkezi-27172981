CREATE OR REPLACE FUNCTION public.cleanup_expired_premiums()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE premium_subscriptions 
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND expires_at < now();
  
  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  
  IF deactivated_count > 0 THEN
    RAISE NOTICE 'Deactivated % expired premium subscriptions', deactivated_count;
  END IF;
END;
$$;