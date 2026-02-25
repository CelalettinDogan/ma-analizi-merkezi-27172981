

# Tahmin Türüne Göre Dinamik Ağırlıklandırma

## Mevcut Durum

`getAIMathWeights()` tüm tahmin türlerini tek bir havuzda toplayarak genel bir AI/Math ağırlık çifti döndürüyor. Bu, örneğin AI'ın "Alt/Üst" tahmininde çok başarılı ama "KG"de zayıf olduğu durumda her ikisine de aynı ağırlığı veriyor.

## Değişiklik

### 1. `getAIMathWeights` fonksiyonunu per-type yapıya çevir

**Dosya:** `src/services/mlPredictionService.ts`

Mevcut fonksiyonun imzasını ve mantığını değiştir:
- Yeni imza: `getAIMathWeights(predictionType?: string)` 
- `predictionType` verilirse sadece o satırdan ağırlık hesapla
- Verilmezse mevcut genel ortalama davranışını koru (fallback)
- Minimum 20 sample kuralı per-type bazında uygulanır; yeterli veri yoksa `null` döner ve 50/50 kullanılır

### 2. `useMatchAnalysis.ts`'de her tahmin için ayrı ağırlık çek

**Dosya:** `src/hooks/useMatchAnalysis.ts`

Analiz başlangıcında tek bir `getAIMathWeights()` çağrısı yerine, her tahmin türü için ayrı çağrı:
- `getAIMathWeights('Maç Sonucu')` → Maç sonucu tahmini için
- `getAIMathWeights('Toplam Gol Alt/Üst')` → Üst/Alt tahmini için
- `getAIMathWeights('Karşılıklı Gol')` → KG tahmini için
- vb.

Her `calculateHybridConfidence` çağrısına ilgili tahmin türünün ağırlığı geçilir. Yeterli veri yoksa o tür için 50/50 kullanılır.

### 3. Admin panelde per-type ağırlık gösterimi

**Dosya:** `src/components/admin/AIManagement.tsx`

"AI vs Matematik" tab'ında her tahmin türü için aktif ağırlıkları göster:
```
Maç Sonucu:     AI %49 | Math %51
Alt/Üst:        AI %56 | Math %44
Karşılıklı Gol: AI %44 | Math %56
```

### Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/services/mlPredictionService.ts` | `getAIMathWeights` fonksiyonuna opsiyonel `predictionType` parametresi ekle |
| `src/hooks/useMatchAnalysis.ts` | Her tahmin türü için ayrı ağırlık çekip `calculateHybridConfidence`'a geç |
| `src/components/admin/AIManagement.tsx` | Per-type aktif ağırlıkları göster |

