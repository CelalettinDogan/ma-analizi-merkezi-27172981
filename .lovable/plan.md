

# BTTS Bölümüne "Hibrit Güven" Etiketi Ekleme

## Sorun
Gol analizi bölümündeki Karşılıklı Gol (KG) yüzdesi (%47) sadece Poisson istatistiksel olasılığı gösteriyor. Kullanıcı bunu da "Hibrit" olarak etiketlememizi istiyor, böylece üstteki tahmin kartındaki %74 hibrit güvenle tutarlı bir dil kullanılmış olacak.

## Önemli Not
Bu %47 değeri aslında saf Poisson istatistiksel olasılığıdır, hibrit güven skoru değildir. İki seçenek var:

1. **Sadece etiketi "Hibrit" yap** — Görsel tutarlılık sağlanır ama teknik olarak yanlış olur
2. **Gerçek hibrit değeri hesaplayıp göster** — `ScorePredictionChart`'a KG tahmininin hibrit güven skorunu da geçir ve onu göster

## Plan

### Yaklaşım: Gerçek hibrit KG güvenini BTTS bölümünde göster

**Dosya:** `src/components/charts/ScorePredictionChart.tsx`
- Props'a `bttsHybridConfidence?: number` ekle
- BTTS bölümünde iki satır göster:
  - **Poisson Olasılığı**: %47 (mevcut değer)
  - **Hibrit Güven**: %74 (yeni prop'tan gelen değer)
- Hibrit güven varsa onu da progress bar ile göster

**Dosya:** `src/components/analysis/AdvancedAnalysisTabs.tsx`, `src/components/AnalysisSection.tsx`, `src/components/analysis/CollapsibleAnalysis.tsx`
- `ScorePredictionChart` çağrılarına `bttsHybridConfidence` prop'unu ekle
- Bu değeri `analysis.predictions` içinden KG tahmininin hibrit güveninden hesapla

### Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/charts/ScorePredictionChart.tsx` | `bttsHybridConfidence` prop ekle, BTTS bölümünde hibrit güveni de göster |
| `src/components/analysis/AdvancedAnalysisTabs.tsx` | KG tahmininden hibrit güveni hesaplayıp prop olarak geç |
| `src/components/AnalysisSection.tsx` | Aynı şekilde hibrit güveni geç |
| `src/components/analysis/CollapsibleAnalysis.tsx` | Aynı şekilde hibrit güveni geç |

