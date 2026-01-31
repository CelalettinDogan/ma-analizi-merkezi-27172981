
# Manuel Yenileme Butonlarını Kaldırma Planı

## Genel Bakış
Arka plan senkronizasyonu (15 dk / 30 dk cron job'lar) aktif olduğundan, kullanıcıya sunulan manuel yenileme butonları gereksiz hale geldi. Bu plan, kullanıcı arayüzündeki gereksiz yenileme butonlarını kaldırarak daha temiz bir deneyim sunmayı hedefliyor.

## Kaldırılacak Butonlar

### 1. TodaysMatches.tsx (Ana Sayfa - Bugünün Maçları)
- Başlıktaki RefreshCw ikon butonu
- Alt kısımdaki küçük RefreshCw butonu
- İlgili `handleRefresh` fonksiyonu ve `isRefreshing` state'i

### 2. Live.tsx (Canlı Maçlar Sayfası)
- Boş durum kartındaki "Yenile" butonu (maç yokken gösterilen)
- İlgili `handleRefresh` fonksiyonu

### 3. LiveMatchesSection.tsx (Canlı Maçlar Bileşeni)
- Başlıktaki RefreshCw ikon butonu
- İlgili `handleRefresh` fonksiyonu ve `isRefreshing` state'i

## Korunacak Butonlar

| Buton | Dosya | Neden Korunuyor |
|-------|-------|-----------------|
| "Tekrar Dene" (Hata durumu) | Live.tsx | Ağ hatası durumunda tek çıkış yolu |
| "Tekrar Dene" (Hata durumu) | LiveMatchesSection.tsx | Hata durumunda gerekli |
| "Tekrar Dene" | ErrorBoundary.tsx | Uygulama hatasından kurtarma |
| Admin yenileme | Admin.tsx | Yönetici işlevselliği |
| "Otomatik Doğrula" | AutoVerifyButton.tsx | Farklı işlev (doğrulama) |
| "Güncelle" | AnalysisHistory.tsx | Kullanıcı verileri için gerekli |

## Yapılacak Değişiklikler

### TodaysMatches.tsx
- `isRefreshing` state kaldırılacak
- `handleRefresh` fonksiyonu kaldırılacak
- `onRefresh` prop kullanımları kaldırılacak (iki adet buton)
- RefreshCw import'u kaldırılacak (kullanılmıyorsa)

### Live.tsx
- Boş durum kartındaki "Yenile" butonu kaldırılacak
- `handleRefresh` fonksiyonu kaldırılacak
- `RefreshCw` import'u kaldırılacak (kullanılmıyorsa)

### LiveMatchesSection.tsx
- `isRefreshing` state kaldırılacak
- `handleRefresh` fonksiyonu kaldırılacak
- Başlıktaki yenile butonu kaldırılacak
- RefreshCw import'u kaldırılacak

## Sonuç
- Daha temiz, daha basit kullanıcı arayüzü
- Arka plan senkronizasyonu ile tutarlı deneyim
- Hata durumlarında kullanıcı hâlâ "Tekrar Dene" ile müdahale edebilir
