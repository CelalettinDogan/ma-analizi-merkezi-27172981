

# AI vs Matematik Ayrı Doğruluk Takibi ve Dinamik Hibrit Ağırlıklandırma

## Sorun

Şu an sistem yalnızca **hibrit tahminin** doğru olup olmadığını kaydediyor (`ml_model_stats`). AI ve Matematik tahminlerinin **ayrı ayrı** doğru olup olmadığı hiçbir yere kaydedilmiyor. Bu yüzden hangisinin daha başarılı olduğunu bilmek ve hibrit skoru buna göre ayarlamak mümkün değil.

## Teknik Plan

### 1. Veritabanı: `prediction_features` tablosuna yeni kolonlar ekle

`prediction_features` tablosunda zaten `ai_confidence`, `mathematical_confidence` ve `was_correct` kolonları var. Ancak **AI ve Matematik tahminlerinin ayrı ayrı doğru olup olmadığı** kaydedilmiyor.

Yeni kolonlar:
- `ai_prediction_value TEXT` — AI'ın tahmini (ör: "Galatasaray Kazanır")
- `math_prediction_value TEXT` — Matematik modelinin tahmini
- `ai_was_correct BOOLEAN` — AI tahmini doğru muydu?
- `math_was_correct BOOLEAN` — Matematik tahmini doğru muydu?

### 2. Veritabanı: `ml_model_stats` tablosuna matematik kolonları ekle

Mevcut tablo sadece genel (hibrit) istatistikleri tutuyor. AI ve Matematik için ayrı sayaçlar eklenir:
- `ai_total INTEGER DEFAULT 0`
- `ai_correct INTEGER DEFAULT 0`
- `ai_accuracy NUMERIC`
- `math_total INTEGER DEFAULT 0`
- `math_correct INTEGER DEFAULT 0`
- `math_accuracy NUMERIC`

### 3. Tahmin kaydında AI ve Matematik değerlerini ayrı kaydet

**Dosya:** `src/hooks/useMatchAnalysis.ts`

`savePredictionFeatures` çağrısında her tahmin için AI ve Matematik tahmin değerlerini (`ai_prediction_value`, `math_prediction_value`) da kaydet.

**Dosya:** `src/services/mlPredictionService.ts`

`savePredictionFeatures` fonksiyonunun parametrelerine `ai_prediction_value` ve `math_prediction_value` ekle.

### 4. Doğrulama sırasında AI ve Matematik'i ayrı ayrı kontrol et

**Dosya:** `src/services/autoVerifyService.ts`

`verifyPredictionWithMatch` fonksiyonunda:
1. `prediction_features` tablosundan `ai_prediction_value` ve `math_prediction_value` oku
2. Her birinin doğruluğunu `checkPredictionCorrect` ile ayrı ayrı kontrol et
3. `ai_was_correct` ve `math_was_correct` kolonlarını güncelle
4. `updateMLModelStats` fonksiyonunu genişlet: AI ve Matematik sayaçlarını ayrı artır

**Dosya:** `src/services/mlPredictionService.ts`

`updateMLModelStats` fonksiyonuna `aiWasCorrect` ve `mathWasCorrect` parametreleri ekle, ayrı sayaçları güncelle.

### 5. Dinamik Hibrit Ağırlıklandırma

**Dosya:** `src/hooks/useMatchAnalysis.ts`

Mevcut sabit `calculateHybridConfidence` fonksiyonu:
```
aiConfidence * 0.4 + mathConfidence * 0.4 + baseline * 0.2
```

Bu fonksiyonu dinamik hale getir:
1. Analiz başlangıcında `ml_model_stats` tablosundan AI ve Matematik doğruluk oranlarını çek
2. Hangisi daha doğruysa ona daha fazla ağırlık ver:
```
aiWeight = aiAccuracy / (aiAccuracy + mathAccuracy)
mathWeight = mathAccuracy / (aiAccuracy + mathAccuracy)
hybrid = aiConf * aiWeight + mathConf * mathWeight
```
3. Yeterli veri yoksa (toplam < 20) mevcut 50/50 oranını koru

**Dosya:** `src/lib/utils.ts`

`getHybridConfidence` fonksiyonuna da opsiyonel `aiWeight`/`mathWeight` parametreleri ekle.

### 6. Admin Paneli: AI vs Matematik Karşılaştırma Tab'ı

**Dosya:** `src/components/admin/AIManagement.tsx`

Mevcut Tabs'e yeni bir "AI vs Matematik" tab'ı ekle:
- Her tahmin türü için AI doğruluk oranı vs Matematik doğruluk oranı yan yana barlar
- Genel karşılaştırma özet kartları
- "Aktif Ağırlıklar" gösterimi (AI: %XX, Matematik: %XX)

**Dosya:** `src/hooks/admin/useAdminData.ts`

`ml_model_stats` tablosundan yeni AI/Matematik kolonlarını da çekecek şekilde güncelle.

### Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| Migration SQL | `prediction_features` ve `ml_model_stats` tablolarına yeni kolonlar |
| `src/services/mlPredictionService.ts` | `savePredictionFeatures` ve `updateMLModelStats` genişlet |
| `src/hooks/useMatchAnalysis.ts` | AI/Matematik tahmin değerlerini kaydet, dinamik ağırlık çek |
| `src/services/autoVerifyService.ts` | AI ve Matematik'i ayrı doğrula |
| `src/lib/utils.ts` | `getHybridConfidence`'a ağırlık parametreleri ekle |
| `src/components/admin/AIManagement.tsx` | AI vs Matematik karşılaştırma tab'ı ekle |
| `src/hooks/admin/useAdminData.ts` | Yeni istatistik verilerini çek |
| `supabase/functions/auto-verify/index.ts` | Edge Function'da da ayrı doğrulama |

