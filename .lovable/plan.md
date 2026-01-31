

# Sıralama Cron Job Optimizasyonu ve Marka İsmi Düzeltme Planı

## Genel Bakış
Bu plan iki ana değişikliği kapsar:
1. **Cron Job Optimizasyonu**: `sync-standings` job'unun saatlik çalışmasını 6 saatlik periyoda düşürme
2. **Marka Tutarlılığı**: Tüm "Gol Metrik" ifadelerini "GolMetrik" olarak birleştirme

---

## Bölüm 1: Cron Job Güncelleme

### Mevcut Durum
- **Job Adı**: `sync-standings-hourly`
- **Mevcut Schedule**: `0 * * * *` (Her saat başı)
- **Aylık Çağrı**: ~720

### Hedef
- **Yeni Schedule**: `0 */6 * * *` (Her 6 saatte bir: 00:00, 06:00, 12:00, 18:00 UTC)
- **Aylık Çağrı**: ~120
- **Tasarruf**: %83 azalma

### Kullanıcı Tarafından Çalıştırılacak SQL
Cloud View → Run SQL bölümünde çalıştırılacak:

```text
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

## Bölüm 2: Marka İsmi Düzeltmeleri

"Gol Metrik" → "GolMetrik" değişiklikleri yapılacak dosyalar:

### Ana Uygulama Dosyaları
| Dosya | Satır | Değişiklik |
|-------|-------|------------|
| `index.html` | 12, 14, 16, 18, 25 | Title, meta author, og:title, twitter:title |
| `capacitor.config.ts` | 5 | appName |
| `src/components/layout/AppHeader.tsx` | 38, 41 | Alt text, brand text |
| `src/components/layout/AppFooter.tsx` | 19, 84 | Brand text |

### Bileşenler
| Dosya | Satır | Değişiklik |
|-------|-------|------------|
| `src/components/ShareCard.tsx` | 177 | Watermark |
| `src/components/Onboarding.tsx` | 30 | Hoşgeldin başlığı |

### Sayfalar
| Dosya | Satır | Değişiklik |
|-------|-------|------------|
| `src/pages/Terms.tsx` | 39, 56, 69 | Yasal metinler |
| `src/pages/Privacy.tsx` | 39 | Gizlilik metni |
| `src/pages/Auth.tsx` | 433, 506, 544, 557 | Gizlilik modal içeriği |
| `src/pages/Profile.tsx` | 981, 1023, 1070 | Profil içi yasal metinler |
| `src/pages/ResetPassword.tsx` | 25 | Sayfa başlığı |

### Backend
| Dosya | Satır | Değişiklik |
|-------|-------|------------|
| `supabase/functions/ai-chatbot/index.ts` | 162 | AI sistem prompt'u |
| `supabase/functions/admin-cron-status/index.ts` | 93-96 | Job metadata (isim ve açıklama) |

### Cache Ayarları (Opsiyonel)
| Dosya | Satır | Değişiklik |
|-------|-------|------------|
| `src/constants/predictions.ts` | 75 | STANDINGS cache'i 1 saat → 6 saat |
| `src/services/apiRequestManager.ts` | 25 | standings cache'i 1 saat → 6 saat |

---

## Uygulama Adımları

### Adım 1: Marka Tutarlılığı (Kod Değişiklikleri)
Tüm dosyalarda "Gol Metrik" → "GolMetrik" değişiklikleri yapılacak.

### Adım 2: Cache Süreleri Güncelleme
Frontend cache süreleri 6 saate yükseltilecek (cron job ile uyumlu).

### Adım 3: Admin Panel Metadata
`admin-cron-status` edge function'ındaki job bilgileri güncellenecek.

### Adım 4: Kullanıcı SQL İşlemi
Cloud View'da cron job güncellemesi için SQL çalıştırılacak (kullanıcı tarafından).

---

## Özet

| Metrik | Önce | Sonra |
|--------|------|-------|
| Standings sync sıklığı | 1 saat | 6 saat |
| Aylık Edge Function çağrısı | ~720 | ~120 |
| Marka tutarlılığı | "Gol Metrik" (boşluklu) | "GolMetrik" (bitişik) |
| Güncellenen dosya sayısı | - | 13 dosya |

