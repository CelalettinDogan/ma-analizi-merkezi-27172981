-- ============================================
-- CLEANUP FUNCTIONS FOR DATABASE OPTIMIZATION
-- ============================================

-- Function: Clean up bet slips older than 48 hours
CREATE OR REPLACE FUNCTION public.cleanup_old_bet_slips()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete bet_slip_items first (due to foreign key)
  DELETE FROM bet_slip_items
  WHERE slip_id IN (
    SELECT id FROM bet_slips 
    WHERE created_at < NOW() - INTERVAL '48 hours'
  );
  
  -- Then delete bet_slips
  DELETE FROM bet_slips 
  WHERE created_at < NOW() - INTERVAL '48 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old bet slips', deleted_count;
END;
$$;

-- Function: Clean up verified predictions older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_predictions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete prediction_features first (due to foreign key)
  DELETE FROM prediction_features
  WHERE prediction_id IN (
    SELECT id FROM predictions 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_correct IS NOT NULL
  );
  
  -- Then delete verified predictions older than 30 days
  DELETE FROM predictions 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_correct IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old verified predictions', deleted_count;
END;
$$;

-- Function: Clean up old prediction features (30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_features()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM prediction_features 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old prediction features', deleted_count;
END;
$$;

-- Schedule cleanup jobs with pg_cron
-- Note: These will be scheduled if pg_cron extension is available

-- Daily cleanup of old bet slips at 03:00 UTC
SELECT cron.schedule(
  'cleanup-old-bet-slips',
  '0 3 * * *',
  'SELECT public.cleanup_old_bet_slips();'
);

-- Weekly cleanup of old predictions at 04:00 UTC on Sundays
SELECT cron.schedule(
  'cleanup-old-predictions',
  '0 4 * * 0',
  'SELECT public.cleanup_old_predictions();'
);

-- Weekly cleanup of old features at 04:30 UTC on Sundays
SELECT cron.schedule(
  'cleanup-old-features',
  '30 4 * * 0',
  'SELECT public.cleanup_old_features();'
);