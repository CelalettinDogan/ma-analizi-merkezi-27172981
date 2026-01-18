-- Mevcut günlük job'ı sil (varsa)
SELECT cron.unschedule('daily-auto-verify-predictions');

-- Yeni saatlik job oluştur (her saat başı)
SELECT cron.schedule(
  'hourly-auto-verify-predictions',
  '0 * * * *',
  $$SELECT
    net.http_post(
      url:=CONCAT(current_setting('supabase.project_url'), '/functions/v1/auto-verify'),
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase.anon_key') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id$$
);