
# Sıralama Sayfası Düzeltmeleri

## Tespit Edilen Sorunlar

### 1. Statik Sezon Bilgisi
- **Konum:** `src/pages/Standings.tsx:170`
- **Mevcut:** "2024/25 Sezonu" (hardcoded)
- **Sorun:** Sezon bilgisi statik olarak yazılmış, dinamik değil
- **Çözüm:** Sezon bilgisini otomatik hesaplayan bir yardımcı fonksiyon oluşturulacak

### 2. Form Verisi Null Geliyor
- **Veritabanı durumu:** `cached_standings` tablosundaki `form` sütunu tüm takımlar için `null`
- **Neden:** Football-data.org API V4'te `form` verisi:
  - Bazı liglerde/zamanlarda sağlanmıyor
  - Ücretsiz API katmanında kısıtlı olabilir
  - Sezon başında yeterli maç yoksa boş geliyor

---

## Çözüm Planı

### Adım 1: Dinamik Sezon Hesaplama
Avrupa futbol sezonları Ağustos-Mayıs arasında oynanır. Tarih bazlı otomatik sezon tespiti:

```text
Algoritma:
- Ağustos'tan (dahil) sonra: mevcut yıl / sonraki yıl
- Ağustos'tan önce: önceki yıl / mevcut yıl

Örnek (Şubat 2026):
- Şubat < Ağustos → 2025/26 Sezonu
```

**Değişiklik:** `src/pages/Standings.tsx`
- Yeni `getCurrentSeason()` fonksiyonu eklenecek
- Statik "2024/25 Sezonu" metni dinamik hale getirilecek

### Adım 2: Form Verisi Fallback Sistemi
API'den form verisi gelmediğinde, mevcut `won/draw/lost` verilerinden alternatif form göstergesi oluşturulacak.

**Değişiklik:** `src/components/standings/FormAnalysisTab.tsx`
- Form verisi yoksa, galibiyet oranına dayalı puan hesaplaması
- Alternatif: "Form verisi yok" mesajı yerine gerçek performans metrikleri gösterilecek

### Adım 3: Edge Function İyileştirmesi (Opsiyonel)
API yanıtını loglayarak form verisinin gerçekten gelip gelmediğini doğrulama.

**Değişiklik:** `supabase/functions/sync-standings/index.ts`
- API yanıtında form verisinin varlığını kontrol eden log ekleme
- Null değerleri açıkça işleme

---

## Değiştirilecek Dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `src/pages/Standings.tsx` | Dinamik sezon hesaplama fonksiyonu + statik metin değişimi |
| `src/components/standings/FormAnalysisTab.tsx` | Form verisi yokken alternatif metrik gösterimi |
| `supabase/functions/sync-standings/index.ts` | Form verisi debug logu (opsiyonel) |

---

## Teknik Detaylar

### Dinamik Sezon Fonksiyonu
```text
const getCurrentSeason = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Ağustos (7) veya sonrasıysa yeni sezon başlamıştır
  if (month >= 7) {
    return `${year}/${(year + 1).toString().slice(-2)} Sezonu`;
  } else {
    return `${year - 1}/${year.toString().slice(-2)} Sezonu`;
  }
};
```

### Form Verisi Fallback
```text
Form null ise:
- Galibiyet oranı = won / played_games
- Puan: yüksek oran = "İyi Form", düşük oran = "Düşük Form"
- Alternatif olarak W/D/L sayılarından son dönem tahmini
```

---

## Beklenen Sonuç

| Önceki Durum | Sonraki Durum |
|--------------|---------------|
| "2024/25 Sezonu" (statik) | "2025/26 Sezonu" (dinamik, otomatik güncellenir) |
| "0 puan" (form null) | Gerçek performans metrikleri veya galibiyet oranına dayalı sıralama |
| Boş form ikonları | "Form verisi bekleniyor" mesajı veya alternatif gösterim |
