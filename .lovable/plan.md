

## Plan: Aynı Maçı Tekrar Analiz Ettiğinde Hak Düşürme

### Sorun
Ücretsiz kullanıcı aynı maçı (ör. Arsenal vs Chelsea) ikinci kez analiz ettiğinde `incrementUsage()` tekrar çağrılıyor ve günlük 2 hakkından biri daha düşüyor. Aynı maç için tekrar hak harcamamalı.

### Çözüm
Client-side'da analiz edilmiş maçları bir `Set` ile takip et. Aynı maç tekrar seçildiğinde:
1. Analizi yine çalıştır (güncel veri göstermek için)
2. Ama `incrementUsage()` çağırma

### Değişiklikler

**`src/pages/Index.tsx`**
- Bir `useRef<Set<string>>` ekle: `analyzedMatchesRef` — bugün analiz edilen maçları tutar
- Match key: `${homeTeam}-${awayTeam}-${matchDate}` formatında
- `handleMatchSelect` içinde analiz başarılı olduktan sonra:
  - Key set'te varsa → `incrementUsage()` çağırma
  - Key set'te yoksa → `incrementUsage()` çağır, sonra key'i set'e ekle
- Aynı mantığı `handleFormSubmit` için de uygula

Tek dosya değişikliği, ~10 satır ekleme. Veritabanı değişikliği yok.

