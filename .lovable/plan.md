

# Hibrit Market Selection Engine — Refactor Planı

## Mevcut Sorunlar

1. **Eşitsiz confidence eşikleri**: `predictionEngine.ts`'de 1X2 marketi `>55%` ile "yüksek" olurken, BTTS `>65%` gerektiriyor. 1X2 doğası gereği daha polarize olduğu için neredeyse her maçta "yüksek" çıkıyor.

2. **`mathConfidenceToNumber` sabit mapping**: `yüksek=0.8`, `orta=0.6`, `düşük=0.4` — market türünden bağımsız. 1X2'nin "yüksek"i ile BTTS'nin "orta"sı arasında gerçek sinyal gücü farkı yansımıyor.

3. **`selectBestPrediction`** en yüksek raw Poisson olasılığını seçiyor. 1X2'nin ham olasılığı (%55-65) doğal olarak BTTS'den (%50-60) yüksek çıkar, ama bu "daha güvenilir sinyal" demek değil.

4. **Market reliability / historical accuracy** hiç kullanılmıyor. `ml_model_stats` tablosunda market bazlı doğruluk verileri var ama ana tahmin seçiminde değerlendirilmiyor.

---

## Yeni Mimari: Market-Aware Hybrid Scoring

### Katman 1: `src/utils/marketScoring.ts` (YENİ DOSYA)

Her market için bağımsız bir **Final Market Score (FMS)** hesaplayan utility:

```
FMS = (signalStrength × 0.35) + (modelAgreement × 0.25) + (historicalReliability × 0.20) + (edgeClarity × 0.20)
```

Bileşenler:
- **signalStrength**: Poisson olasılığının market-spesifik "kesinlik" eşiğinden ne kadar uzakta olduğu. 1X2'de %50 belirsizlik noktası, BTTS'de %50, O/U'da %50. Mesafe ne kadar büyükse sinyal o kadar güçlü.
- **modelAgreement**: AI, Math ve ML'nin aynı yönde mi gösterdiği (0 veya 1, kısmi uyum 0.5)
- **historicalReliability**: `ml_model_stats` tablosundan market bazlı accuracy oranı (0-1)
- **edgeClarity**: Olasılığın belirsizlik bölgesinden (45-55%) ne kadar uzak olduğu, normalized

Market-spesifik kalibrasyon config'i:

```typescript
const MARKET_CONFIG = {
  'Maç Sonucu': { 
    uncertaintyCenter: 33.3, // 3 yönlü market
    volatilityPenalty: 0.15, // 3 sonuçlu → daha volatil
    minEdgeThreshold: 12,    // %33+12 = %45'in altında edge yok
  },
  'Toplam Gol Alt/Üst': { 
    uncertaintyCenter: 50,
    volatilityPenalty: 0,
    minEdgeThreshold: 8,
  },
  'Karşılıklı Gol': { 
    uncertaintyCenter: 50,
    volatilityPenalty: 0,
    minEdgeThreshold: 8,
  },
  // ... diğer marketler
};
```

1X2'ye `volatilityPenalty` uygulanması, 3 yönlü marketin doğal avantajını dengeler.

### Katman 2: `predictionEngine.ts` Güncelleme

Confidence eşiklerini market-spesifik ve simetrik hale getir:

| Market | Yüksek | Orta | Düşük |
|--------|--------|------|-------|
| 1X2 (mevcut) | >55% | >45% | rest |
| 1X2 (yeni) | >58% | >45% | rest |
| BTTS (mevcut) | >65% | >55% | rest |
| BTTS (yeni) | >60% | >52% | rest |
| O/U (mevcut) | >60% | >55% | rest |
| O/U (yeni) | >58% | >52% | rest |

Not: Değerler yapay dengeleme değil, market doğasına uygun kalibrasyon. BTTS eşikleri düşürülüyor çünkü binary markette %60 zaten güçlü sinyal.

### Katman 3: `Prediction` type genişletme (`types/match.ts`)

```typescript
export interface Prediction {
  // ... mevcut alanlar
  marketScore?: number;        // Final Market Score (0-100)
  signalStrength?: number;     // Sinyal gücü (0-100)
  modelAgreement?: number;     // Model uyumu (0-100)
  historicalReliability?: number; // Tarihsel güvenilirlik (0-100)
  edgeClarity?: number;        // Edge netliği (0-100)
  riskLevel?: 'low' | 'medium' | 'high';
  isRecommended?: boolean;     // En iyi market mi?
}
```

### Katman 4: `useMatchAnalysis.ts` Güncelleme

Tahminler oluşturulduktan sonra, `marketScoring` utility'si ile her market için FMS hesapla:

1. `ml_model_stats`'dan market bazlı historical accuracy çek (mevcut `getAIMathWeights` ile paralel)
2. Her prediction'a `marketScore`, `signalStrength`, `modelAgreement`, `historicalReliability`, `edgeClarity`, `riskLevel` ekle
3. En yüksek `marketScore`'a sahip prediction'ı `isRecommended: true` olarak işaretle
4. Predictions array'ini `marketScore` sırasına göre sırala

### Katman 5: `predictionService.ts` Güncelleme

`selectBestPrediction` fonksiyonunu `marketScore` bazlı çalışacak şekilde güncelle:
- `marketScore` varsa onu kullan
- Yoksa mevcut Poisson probability fallback

### Katman 6: UI Güncellemeleri

**AIRecommendationCard**: En yüksek `marketScore`'lu prediction'ı göster (zaten `sortedPredictions[0]` mantığı var, sıralama `marketScore`'a geçecek)

**PredictionCard**: Market Score progress bar'ı ekle + risk level badge

**PredictionPillSelector**: Sıralamayı `marketScore` bazlı yap, recommended pill'e özel badge ekle

---

## Değişecek Dosyalar

1. **`src/utils/marketScoring.ts`** — YENİ: Market scoring engine
2. **`src/utils/predictionEngine.ts`** — Confidence eşiklerini market-spesifik güncelle
3. **`src/types/match.ts`** — Prediction interface genişlet
4. **`src/hooks/useMatchAnalysis.ts`** — Market scoring entegrasyonu + historical reliability fetch
5. **`src/services/predictionService.ts`** — `selectBestPrediction` güncelle
6. **`src/lib/utils.ts`** — `getHybridConfidence`'ı marketScore-aware yap
7. **`src/components/analysis/AIRecommendationCard.tsx`** — marketScore sıralama
8. **`src/components/PredictionCard.tsx`** — Market score bar + risk badge
9. **`src/components/analysis/PredictionPillSelector.tsx`** — marketScore sıralama + recommended badge

## Korunacaklar

- Mevcut 3 katmanlı hibrit mimari (AI + Math + ML) aynen kalacak
- `prediction_features` ve `ml_model_stats` tablo yapıları değişmeyecek
- Edge function'lar değişmeyecek
- Confidence değerleri sahte dengeleme yapılmayacak — gerçek farklar korunacak

## Continuous Learning Altyapısı

Zaten mevcut olan `ml_model_stats` tablosu market bazlı accuracy takibi yapıyor. Yeni `historicalReliability` bileşeni bu veriyi aktif olarak kullanarak market selection'ı sürekli iyileştirecek. `train-ml-model` edge function haftalık çalışmaya devam edecek.

