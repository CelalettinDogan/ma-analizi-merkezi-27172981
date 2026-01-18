-- Mevcut bozuk cron job'ı sil
SELECT cron.unschedule('hourly-auto-verify-predictions');

-- Yeni saatlik job oluştur - HARDCODED URL ile
SELECT cron.schedule(
  'hourly-auto-verify-predictions',
  '0 * * * *',
  $$SELECT
    net.http_post(
      url:='https://qqhvdpzidjqcqwikpdeu.supabase.co/functions/v1/auto-verify',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxaHZkcHppZGpxY3F3aWtwZGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDAyOTMsImV4cCI6MjA4NDA3NjI5M30.PZuUI8m462_JBUHePKxZAZoYgsgr-VA9VGEOw_9O3LA"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id$$
);