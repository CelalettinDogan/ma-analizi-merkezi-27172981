

# Analiz Performans ve Progress Bar İyileştirmesi

## Sorun 1: Uzun Süren Analizler

`analyzeMatch` fonksiyonunda sıralı çağrılar bottleneck oluşturuyor:

1. **`getAIMathWeights` × 4 tip** — Ana analiz başlamadan ÖNCE 4 ayrı DB sorgusu yapılıyor (satır 224-234)
2. **`getMLPrediction`** — Edge function çağrısı (AI Gateway) en yavaş adım, 5-15 saniye sürebiliyor
3. **`savePredictions` + `savePredictionFeatures`** — Analiz bittikten sonra sıralı DB yazımları

**Düzeltme (`useMatchAnalysis.ts`):**
- `getAIMathWeights` çağrılarını ana veri çekme ile paralelize et (standings + weights aynı anda)
- `savePredictions` ve `savePredictionFeatures`'ı fire-and-forget yap (result'ı bekleme, `await` kaldır) — kullanıcı sonuçları görsün, DB yazımı arka planda olsun

## Sorun 2: Progress Bar %92'de Takılıyor

Progress bar fake timing kullanıyor — gerçek ilerlemeyle bağlantısı yok. Uzun analizlerde %92'de dakikalarca kalabiliyor.

**Düzeltme (`AnalysisLoadingState.tsx`):**
- Progress hızını azalt: 300ms interval → 500ms, artış `+1-3` (şu an `+1-5`)
- %85 sonrası çok yavaşlat (her 800ms'de +0.5) — böylece uzun analizlerde bile hareket var
- Step geçiş süresini 1500ms → 2000ms yap (5 step × 2s = 10s, ML çağrısı süresine daha uygun)

## Sorun 3: Drawer Tekrar Açılma

Mevcut kod doğru çalışıyor — `handleMatchSelect` her seferinde `setAnalysisDrawerOpen(false)` yapıyor, `pendingAnalysisScrollRef` tekrar `true` oluyor. Ancak aynı maçı tekrar analiz ederken `analysis` null → aynı obje olduğu için `useEffect` tetiklenmeyebilir. 

**Guard ekle (`Index.tsx`):** `useEffect` dependency'sine `analysis` object reference'ını koy — zaten var ama `pendingAnalysisScrollRef` kontrolünü güçlendir.

## Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|-----------|
| `src/hooks/useMatchAnalysis.ts` | Weight fetch'i paralelize et, DB save'leri fire-and-forget yap |
| `src/components/analysis/AnalysisLoadingState.tsx` | Progress timing'i yavaşlat, step geçişini uzat |

