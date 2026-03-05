

# Faz 3: Gerçek ML Öğrenme Sistemi

## Genel Bakış

`prediction_features` tablosundaki doğrulanmış verileri kullanarak her tahmin türü için lojistik regresyon katsayıları hesaplayan bir edge function oluşturulacak. Bu katsayılar DB'de saklanacak ve her analizde Poisson + AI'a ek olarak ML modeli de tahmin üretecek.

## Mimari

```text
┌──────────────────────────────────────┐
│ train-ml-model (Edge Function)       │
│ Haftalık pg_cron ile çalışır         │
│                                      │
│ 1. prediction_features'dan           │
│    doğrulanmış verileri çek          │
│ 2. Feature normalizasyonu            │
│ 3. Gradient descent ile              │
│    lojistik regresyon eğit           │
│ 4. Katsayıları ml_model_weights      │
│    tablosuna kaydet                  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ ml_model_weights (Yeni tablo)        │
│ prediction_type | weights (jsonb)    │
│ feature_names   | metrics            │
│ trained_at      | sample_count       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ useMatchAnalysis (Client)            │
│                                      │
│ 1. Poisson hesapla (mevcut)          │
│ 2. AI tahmin al (mevcut)             │
│ 3. ML inference: σ(w·x) hesapla     │
│ 4. 3 katmanlı hibrit birleştirme     │
│    AI × w1 + Math × w2 + ML × w3    │
└──────────────────────────────────────┘
```

## Değişiklikler

### 1. Yeni tablo: `ml_model_weights`
- `prediction_type` (text, PK) — "Maç Sonucu", "Toplam Gol Alt/Üst" vb.
- `weights` (jsonb) — `{ "home_form_score": 0.23, "away_form_score": -0.15, ... , "bias": 0.1 }`
- `feature_names` (text[]) — kullanılan feature listesi
- `metrics` (jsonb) — `{ "accuracy": 0.67, "sample_count": 150, "auc": 0.72 }`
- `trained_at` (timestamptz)
- `is_active` (boolean, default true)

### 2. Yeni edge function: `train-ml-model`
- `prediction_features` + `predictions` join ile doğrulanmış kayıtları çeker
- Her prediction_type için ayrı lojistik regresyon eğitir
- Features: `home_form_score`, `away_form_score`, `home_goal_avg`, `away_goal_avg`, `position_diff`, `home_advantage_score`, `h2h_home_wins`, `h2h_away_wins`, `expected_goals`, `home_attack_index`, `home_defense_index`, `away_attack_index`, `away_defense_index`, `home_momentum`, `away_momentum`, `poisson_home_expected`, `poisson_away_expected`
- Gradient descent: 1000 iterasyon, learning rate 0.01, L2 regularization
- Minimum 30 sample threshold — altında eğitim yapılmaz
- Sonuçları `ml_model_weights` tablosuna yazar

### 3. Client-side ML inference: `src/services/mlInferenceService.ts`
- `ml_model_weights` tablosundan katsayıları çeker (6 saat cache)
- `runMLInference(features, predictionType)` → olasılık (0-1) döner
- Sigmoid fonksiyonu: `σ(z) = 1 / (1 + e^(-z))`
- Feature normalizasyonu (min-max, eğitimde kullanılan aralıklarla)

### 4. `useMatchAnalysis.ts` güncelleme
- ML inference'ı Poisson ve AI ile paralel çalıştır
- Üç katmanlı hibrit: `final = AI × w_ai + Math × w_math + ML × w_ml`
- `w_ml` başlangıçta 0.2, AI ve Math'ten 0.1'er düşürülür
- ML sample_count < 50 ise ML ağırlığı 0 (henüz güvenilir değil)

### 5. `ml-prediction` edge function güncelleme
- AI prompt'una ML model confidence'ı da ekle (varsa)
- AI'ın ML modeli ile çeliştiği durumlarda daha temkinli olmasını sağla

### 6. pg_cron job
- Haftalık çalışacak (Pazartesi 03:00 UTC)
- `train-ml-model` edge function'ı tetikler

### 7. Admin panel entegrasyonu
- `AIManagement.tsx`'e yeni "ML Model" tab'ı ekle
- Eğitim tarihi, sample count, per-type accuracy göster
- Manuel "Yeniden Eğit" butonu

## Dosyalar

1. **Yeni**: `supabase/functions/train-ml-model/index.ts` — Eğitim edge function
2. **Yeni**: `src/services/mlInferenceService.ts` — Client-side inference
3. **Güncelleme**: `src/hooks/useMatchAnalysis.ts` — ML katmanı entegrasyonu
4. **Güncelleme**: `supabase/functions/ml-prediction/index.ts` — ML confidence ekleme
5. **Güncelleme**: `src/components/admin/AIManagement.tsx` — ML Model tab
6. **DB Migration**: `ml_model_weights` tablosu oluşturma

