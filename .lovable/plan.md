
## Skor Tahminlerini Premium'a Kilitleme

Analiz ekranında "Doğru Skor" (correct score) içeriklerini free kullanıcılar için blur'layıp, premium kullanıcılara yönlendireceğiz. 3 bileşen etkileniyor:

### 1. AnalysisHeroSummary — "Most Likely Score" kutusu
- `useAccessLevel` hook'u eklenir
- `mostLikelyScore` kutusu (satır 124-133): free kullanıcılar icin skor blur + PremiumTeaserOverlay
- Küçük kilit ikonu ile "Premium" etiketi eklenir

### 2. PredictionPillSelector — "Doğru Skor" pill'i ve detay paneli
- `useAccessLevel` hook'u eklenir  
- Pill'de `prediction.type === 'Doğru Skor'` kontrolü: free kullanıcılarda pill tıklanabilir ama detay panelinde prediction value blur'lu + PremiumTeaserOverlay gösterilir
- PREDICTION_TYPES.CORRECT_SCORE sabiti import edilir

### 3. AIRecommendationCard — Eğer ana tahmin "Doğru Skor" ise
- Zaten `useAccessLevel` kullanıyor
- Ana tahmin `Doğru Skor` ise: prediction value (satır 95-96) free kullanıcılar için blur'lu gösterilir + üstüne küçük PremiumTeaserOverlay

### Dosya Değişiklikleri
- `src/components/analysis/AnalysisHeroSummary.tsx` — blur + overlay ekleme
- `src/components/analysis/PredictionPillSelector.tsx` — blur + overlay ekleme
- `src/components/analysis/AIRecommendationCard.tsx` — skor tahmini blur ekleme
