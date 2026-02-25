

# Güven Skoru Tutarsızlığı - Analiz ve Çözüm Planı

## Sorunun Kök Nedeni

Uygulamada aynı tahmin (örneğin KG - Karşılıklı Gol) farklı bileşenlerde farklı güven yüzdeleri gösteriyor. Bunun sebebi her bileşenin güveni farklı şekilde hesaplaması:

### Mevcut Durum - 3 Farklı Hesaplama

```text
Bileşen                    Hesaplama Yöntemi
─────────────────────────  ──────────────────────────────────
AIRecommendationCard       (aiConfidence + mathConfidence) / 2
                           → Gerçek sayısal ortalama (ör: %74)

ConfidenceVisualizer       confidence string → sabit değer
                           'yüksek' → 85, 'orta' → 55, 'düşük' → 25
                           → Sabit eşleme (ör: %55)

PredictionCard             aiConfidence ve mathConfidence
                           ayrı ayrı gösteriliyor
                           → İki ayrı bar
```

Yani aynı "KG" tahmini:
- **AIRecommendationCard'da**: `(0.82 + 0.66) / 2 = %74` (gerçek hibrit skor)
- **ConfidenceVisualizer'da**: `confidence = 'orta'` → sabit `%55` gösteriyor
- **PredictionCard'da**: AI %82, Matematik %47 gibi ayrı ayrı gösteriyor

Kullanıcının gördüğü %47 muhtemelen `mathConfidence` değerinin tek başına gösterilmesi.

## Çözüm Planı

### 1. ConfidenceVisualizer'ı Gerçek Hibrit Skora Geçir
- `getConfidenceValue` fonksiyonunu string tabanlı sabit değerler yerine `(aiConfidence + mathConfidence) / 2` formülüne çevir
- AI destekli tahminlerde gerçek sayısal değerleri kullan, AI desteksiz olanlarda mevcut string eşlemesini korur

### 2. PredictionCard'a Hibrit Skor Ekle
- AI ve Matematik barlarının üstüne "Hibrit Güven: %XX" özet satırı ekle
- Böylece kullanıcı hem bireysel skorları hem de birleşik skoru görsün

### 3. Tüm Bileşenlerde Tutarlı Fonksiyon Kullan
- `getHybridConfidence` fonksiyonunu tek bir yardımcı modülde tanımla (örneğin `src/lib/utils.ts`)
- AIRecommendationCard, ConfidenceVisualizer, PredictionCard ve PredictionPillSelector hepsinde aynı fonksiyonu import et

### Değişecek Dosyalar
- `src/lib/utils.ts` - `getHybridConfidence` eklenir
- `src/components/charts/ConfidenceVisualizer.tsx` - Gerçek hibrit skoru kullanır
- `src/components/PredictionCard.tsx` - Hibrit skor özet satırı eklenir
- `src/components/analysis/AIRecommendationCard.tsx` - Paylaşılan fonksiyonu import eder
- `src/components/analysis/PredictionPillSelector.tsx` - Paylaşılan fonksiyonu import eder

