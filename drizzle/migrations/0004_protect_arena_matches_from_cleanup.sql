CREATE OR REPLACE FUNCTION public.cleanup_old_cached_matches()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  -- Arena maçları korunur: puanlar, haftalık ödül ve tüm zamanlar sıralaması bunlara bağlı.
  DELETE FROM cached_matches c
  WHERE c.status = 'FINISHED' AND c.updated_at < NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (SELECT 1 FROM arena_weeks w WHERE c.match_id = ANY(w.match_ids));
  DELETE FROM cached_matches c
  WHERE c.utc_date < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (SELECT 1 FROM arena_weeks w WHERE c.match_id = ANY(w.match_ids));
END;
$function$;