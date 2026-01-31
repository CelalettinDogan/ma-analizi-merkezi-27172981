

# Sıralama Cron Job Optimizasyonu ve Marka İsmi Düzeltme Planı

## ✅ Tamamlandı

### Marka Tutarlılığı
Tüm "Gol Metrik" ifadeleri "GolMetrik" olarak güncellendi:
- index.html (title, meta tags)
- capacitor.config.ts (appName)
- AppHeader.tsx, AppFooter.tsx
- ShareCard.tsx, Onboarding.tsx
- Terms.tsx, Privacy.tsx, Auth.tsx, Profile.tsx, ResetPassword.tsx
- ai-chatbot/index.ts, admin-cron-status/index.ts

### Cache Süreleri
- STANDINGS cache: 1 saat → 6 saat

### Admin Panel Metadata
- Job adı: sync-standings-hourly → sync-standings-every-6-hours
- Schedule: "Her saat başı" → "Her 6 saatte bir"

---

## ⚠️ Kullanıcı Tarafından Yapılacak İşlem

Cron job güncellemesi için **Cloud View → Run SQL** bölümünde şu SQL'i çalıştırın:

```sql
SELECT cron.unschedule('sync-standings-hourly');

SELECT cron.schedule(
  'sync-standings-every-6-hours',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://qqhvdpzidjqcqwikpdeu.supabase.co/functions/v1/sync-standings',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxaHZkcHppZGpxY3F3aWtwZGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDAyOTMsImV4cCI6MjA4NDA3NjI5M30.PZuUI8m462_JBUHePKxZAZoYgsgr-VA9VGEOw_9O3LA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

## Özet

| Metrik | Önce | Sonra |
|--------|------|-------|
| Standings sync sıklığı | 1 saat | 6 saat |
| Aylık Edge Function çağrısı | ~720 | ~120 |
| Marka tutarlılığı | "Gol Metrik" | "GolMetrik" |
