
# Cron Job Optimizasyonu ve Gecikme Uyarısı Planı

## Mevcut Durum Analizi

### Aktif Cron Jobs (Cloud Balance Tüketen)
| Job | Mevcut Sıklık | Aylık Çağrı |
|-----|--------------|-------------|
| `sync-live-matches-every-minute` | Her 1 dakika | ~43,200 |
| `sync-matches-every-5-min` | Her 5 dakika | ~8,640 |
| **Toplam Edge Function Çağrısı** | | **~51,840/ay** |

### Optimizasyon Sonrası
| Job | Yeni Sıklık | Aylık Çağrı | Tasarruf |
|-----|-------------|-------------|----------|
| `sync-live-matches` | Her 15 dakika | ~2,880 | %93 |
| `sync-matches` | Her 30 dakika | ~1,440 | %83 |
| **Toplam** | | **~4,320/ay** | **%92** |

---

## Yapılacak Değişiklikler

### 1. Cron Job Sıklıklarını Güncelleme (Veritabanı)
Mevcut cron job'ları güncellemek için SQL komutları çalıştırılacak:

- `sync-live-matches-every-minute`: `* * * * *` → `*/15 * * * *` (15 dakikada bir)
- `sync-matches-every-5-min`: `*/5 * * * *` → `*/30 * * * *` (30 dakikada bir)

### 2. Live.tsx Sayfasına Gecikme Uyarısı Ekleme
Canlı maçlar sayfasının üst kısmına küçük bir bilgilendirme banner'ı eklenecek:

```
⏱️ Veriler 15 dakikaya kadar gecikmeli olabilir
```

**Tasarım Özellikleri:**
- Sarı/amber tonlarında ince bir banner
- Saat ikonu ile birlikte
- Sadece canlı maçlar listelendiğinde gösterilecek
- Responsive tasarım (mobil ve masaüstü uyumlu)

---

## Teknik Detaylar

### Veritabanı Değişiklikleri
İki adet cron job schedule güncellemesi yapılacak:
1. Job ID 4 (`sync-live-matches-every-minute`): Schedule `*/15 * * * *` olarak değiştirilecek
2. Job ID 2 (`sync-matches-every-5-min`): Schedule `*/30 * * * *` olarak değiştirilecek

### UI Değişiklikleri
`src/pages/Live.tsx` dosyasına ekleme:
- Yeni bir `DelayWarningBanner` bileşeni
- League filter'ın altında, içerik alanının üstünde konumlanacak
- Clock ikonu ve Türkçe uyarı metni içerecek

---

## Beklenen Sonuçlar

| Metrik | Önce | Sonra |
|--------|------|-------|
| Edge Function çağrısı/ay | ~52,000 | ~4,300 |
| Cloud kullanımı | Yüksek | %92 azalma |
| Veri güncelliği | 1 dk | 15 dk |
| Kullanıcı deneyimi | Anlık | Gecikme uyarısı ile |
