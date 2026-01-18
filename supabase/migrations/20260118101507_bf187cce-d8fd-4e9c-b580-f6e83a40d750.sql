-- Eski cached_matches kayıtlarını temizleyen fonksiyon
CREATE OR REPLACE FUNCTION cleanup_old_cached_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_finished INTEGER;
  deleted_old INTEGER;
BEGIN
  -- 24 saatten eski FINISHED maçları sil
  DELETE FROM cached_matches 
  WHERE status = 'FINISHED' 
    AND updated_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_finished = ROW_COUNT;
  
  -- 7 günden eski tüm maçları sil
  DELETE FROM cached_matches 
  WHERE utc_date < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_old = ROW_COUNT;
  
  RAISE NOTICE 'Cleanup: % finished matches, % old matches deleted', deleted_finished, deleted_old;
END;
$$;

-- cached_matches için realtime aktifleştir
ALTER PUBLICATION supabase_realtime ADD TABLE public.cached_matches;

-- Günlük temizlik cron job (her gün 03:00 UTC)
SELECT cron.schedule(
  'cleanup-cached-matches-daily',
  '0 3 * * *',
  $$SELECT cleanup_old_cached_matches()$$
);