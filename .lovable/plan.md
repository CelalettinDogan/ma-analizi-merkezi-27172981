
# Admin Panel Optimizasyonu - Gunluk Cron ile Analytics Tablosu

## Mevcut Sorun

Admin paneli her acildiginda 8+ agir sorgu calistiriyor: profiles count, premium subscriptions full scan, chatbot_usage full scan, analysis_usage full scan, ml_model_stats, cached_live_matches count, predictions full scan (league stats icin). Bu buyudukce yavaslayacak ve gereksiz veritabani yuku olusturacak.

## Cozum Ozeti

1. `admin_daily_analytics` tablosu olustur
2. Backend edge function ile gunluk metrikleri hesapla ve tabloya yaz
3. Admin panel sadece son kaydi ceksin
4. Gerekli alanlara index ekle
5. Cron job ile gunluk otomatik calissin

## Adimlar

### Adim 1: Veritabani Degisiklikleri (Migration)

**Yeni tablo: `admin_daily_analytics`**

```text
- id (uuid, PK)
- report_date (date, unique)
- total_users (integer)
- premium_users (integer)
- premium_rate (numeric)
- today_chats (integer)
- today_analysis (integer)
- ai_accuracy (numeric)
- live_matches (integer)
- active_users_24h (integer)
- premium_by_plan (jsonb) -- {"premium_basic": 5, "premium_plus": 3, ...}
- premium_revenue (numeric)
- prediction_stats (jsonb) -- [{type, total, correct, accuracy}]
- league_stats (jsonb) -- [{league, total, correct, accuracy}]
- created_at (timestamptz)
```

**RLS**: Sadece admin okuyabilir (`has_role(auth.uid(), 'admin')` SELECT policy)

**Indexler:**

```text
-- analytics tablosu icin
CREATE INDEX idx_admin_daily_analytics_date ON admin_daily_analytics(report_date DESC);

-- Mevcut tablolar icin (full scan onleme)
CREATE INDEX IF NOT EXISTS idx_chatbot_usage_date ON chatbot_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_analysis_usage_date ON analysis_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_predictions_primary_correct ON predictions(is_primary, is_correct) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_premium_subs_active ON premium_subscriptions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chatbot_usage_last_used ON chatbot_usage(last_used_at);
```

### Adim 2: Edge Function - `compute-admin-analytics`

Yeni edge function olusturulacak. Gorevleri:

- `profiles` count
- `premium_subscriptions` aktif aboneler (plan bazli gruplama)
- `chatbot_usage` ve `analysis_usage` gunluk toplamlar
- `ml_model_stats` dogruluk yuzdesi
- `cached_live_matches` count
- `chatbot_usage` son 24 saat aktif kullanici
- `predictions` lig bazli istatistik (is_primary=true, is_correct not null)
- Sonuclari `admin_daily_analytics` tablosuna upsert et (report_date conflict)

verify_jwt = false (cron'dan cagirilacak)

### Adim 3: Cron Job Kurulumu

Gunluk 06:00 UTC'de calisacak pg_cron job:

```text
Zamanlama: '0 6 * * *'
Hedef: compute-admin-analytics edge function
```

### Adim 4: Frontend Degisiklikleri

**Dosya: `src/hooks/admin/useAdminData.ts`**

`fetchDashboard()` fonksiyonu degisecek:

- Oncelikle `admin_daily_analytics` tablosundan son kaydi cek (report_date DESC, limit 1)
- Eger bugun icin kayit varsa direkt kullan
- Eger yoksa veya eski ise, mevcut live hesaplama mantigi fallback olarak calissin
- `dashboardData` objesini analytics tablosundan doldur

`fetchLeagueStats()` fonksiyonu degisecek:

- `admin_daily_analytics` tablosundaki `league_stats` jsonb alanini kullan
- Fallback: mevcut predictions full scan

`fetchPlanStats()` fonksiyonu degisecek:

- `admin_daily_analytics` tablosundaki `premium_by_plan` ve `premium_revenue` alanlarini kullan
- Fallback: mevcut premium_subscriptions scan

Ayrica manuel "Yenile" butonu eklenecek: Edge function'i tetikleyerek anlik hesaplama yaptirir.

**Dosya: `src/components/admin/DashboardStats.tsx`**

- "Son guncelleme" bilgisi gosterilecek (analytics kaydinin created_at degeri)

### Adim 5: config.toml Guncelleme

```text
[functions.compute-admin-analytics]
verify_jwt = false
```

## Degisecek Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| Migration SQL | Yeni `admin_daily_analytics` tablosu + indexler |
| `supabase/functions/compute-admin-analytics/index.ts` | Yeni edge function |
| `supabase/config.toml` | Yeni function config |
| `src/hooks/admin/useAdminData.ts` | Dashboard/league/plan verilerini analytics tablosundan cek |
| `src/components/admin/DashboardStats.tsx` | Son guncelleme zamanini goster |
| Cron job SQL (insert tool) | Gunluk cron job olustur |

## Performans Kazanimi

- Admin panel acilisinda 8+ sorgu yerine 1 sorgu (son analytics kaydi)
- Buyuk tablolarda full scan yapilmaz
- Indexler ile mevcut sorgular da hizlanir
- Cron ile hesaplama gunluk 1 kez yapilir
- Manuel yenileme butonu ile anlik guncelleme mumkun
