# Tüm Sayfalarda Çeviri Tamamlama Planı

## Sorunun Kaynağı

Ekran görüntüsündeki "Beraberlik" ve "İlk Yarı Sonucu" gibi metinler aslında **veritabanı seviyesinde Türkçe enum değerleri** olarak saklanıyor. Şu anki i18n çalışması sadece statik UI metinlerini kapsıyordu, ama tahmin türleri (`type`) ve tahmin değerleri (`prediction`) data layer'da Türkçe duruyor:

- `src/constants/predictions.ts` → `PREDICTION_TYPES` (Maç Sonucu, İlk Yarı Sonucu, Doğru Skor…)
- `src/services/mlPredictionService.ts` → `'Beraberlik'`, `'Evet'`, `'Hayır'`, `'2.5 Üst'`, `'X Kazanır'`
- `src/services/predictionService.ts`, `autoVerifyService.ts` → bu Türkçe stringleri sonuç doğrulama mantığında **switch/includes** ile kullanıyor

Bu enumları doğrudan değiştirmek backend doğrulama mantığını ve mevcut DB kayıtlarını bozar. Bu yüzden çözüm **display layer** çevirisi olacak.

## Yaklaşım

1. **Yeni helper**: `src/utils/predictionLabels.ts`
   - `formatPredictionType(t, typeStr)` → "İlk Yarı Sonucu" → t('predictions:types.firstHalf')
   - `formatPredictionValue(t, predValue, homeTeam?, awayTeam?)` → "Beraberlik" → t('predictions:values.draw'); "2.5 Üst" → t('predictions:values.over', { line: 2.5 }); "Aston Villa Kazanır" → t('predictions:values.teamWins', { team }); "İY 1.5 Alt" → "HT Under 1.5"; vb.
   - `formatConfidenceLabel(t, level)` → 'yüksek'|'orta'|'düşük' → t('analysis:confidence.high|medium|low')
   - Regex ile dinamik kalıpları yakalar (skor "1-0", "X.Y Üst/Alt", "İY X.Y Üst/Alt", "{team} Kazanır", "İY/MS {x}/{y}")

2. **Locale güncellemeleri** (5 dilde tr/en/de/es/ar):
   - `predictions.json` içine `values.*` anahtarları ekle (draw, yes, no, over, under, htOver, htUnder, teamWins, homeWin, awayWin, score)
   - `predictions.json` `types.*` zaten mevcut, sadece eksik tr versiyonunu kontrol et

3. **Display bileşenlerinde uygula**:
   - `AnalysisHeroSummary.tsx` → `mainPrediction.prediction` ve `mainPrediction.type` satırları
   - `PredictionPillSelector.tsx` → pill etiketleri ve seçili tahmin başlığı
   - `PredictionCard.tsx` → prediction & type render
   - `AdvancedAnalysisTabs.tsx` → tab içerikleri
   - `AIRecommendationCard.tsx`, `CollapsibleAnalysis.tsx`
   - `ShareCard.tsx` → paylaşım kartı (confidence + prediction)
   - `analysis-set/AnalysisSetItem.tsx`, `AnalysisSetDrawer.tsx`
   - `FilteredPredictionsSection.tsx`
   - `TodaysMatches.tsx` → daily pick prediction
   - `useMatchAIPreview.ts` → preview badge (kısa label map'ini i18n'e bağla)

4. **AnalysisHeroSummary'deki confidence renk anahtarı**: Şu anda `confidenceLevel` Türkçe ('yüksek'/'orta'/'düşük') string'iyle objeden seçiyor. Bu data layer enum'u olduğu için string olarak kalacak; sadece görünür "Confidence" label'ı zaten t() ile geliyor.

5. **Kalan hardcoded metinler** (i18n'e taşınacak):
   - `pages/Auth.tsx` → henüz çevrilmemiş kısımlar (form validasyon mesajları, alt linkler)
   - `pages/Premium.tsx` → çevrilmemiş başlıklar/CTA
   - `components/chat/ChatInput.tsx` → placeholder & aria
   - `components/charts/ConfidenceVisualizer.tsx`, `ScorePredictionChart.tsx` → eksen/legend etiketleri
   - `hooks/useLocalNotifications.ts` → bildirim metinleri (kanal, başlık, body) → i18n.t() ile
   - `services/purchaseService.ts` → hata mesajları → toast kullanan tarafa key olarak döndür, çağıran komponent t() ile gösterir; ya da `i18n.t()` doğrudan service içinde
   - `services/smartPicksService.ts` → throw'lardaki Türkçe mesajlar i18n.t() ile

6. **Dokunulmayacak yerler** (kasıtlı):
   - `src/services/predictionService.ts`, `autoVerifyService.ts`, `mlPredictionService.ts`, `mlInferenceService.ts`, `useMatchAIPreview.ts` map **anahtarları** — bunlar veri sözleşmesi
   - `src/constants/predictions.ts` PREDICTION_TYPES değerleri — bunlar enum, DB'de kayıtlı
   - `src/components/admin/*` — önceki kararla kapsam dışı
   - `pages/Privacy.tsx`, `pages/Terms.tsx` yasal metinler — önceki kararla TR

## Teknik Detaylar

`predictionLabels.ts` örnek kalıp eşleştirme:

```ts
// "Aston Villa Kazanır" → teamWins
const winMatch = value.match(/^(.+?) Kazanır$/);
if (winMatch) return t('predictions:values.teamWins', { team: winMatch[1] });

// "2.5 Üst" / "2.5 Alt"
const ouMatch = value.match(/^(\d+\.\d+) (Üst|Alt)$/);
if (ouMatch) return t(`predictions:values.${ouMatch[2] === 'Üst' ? 'over' : 'under'}`, { line: ouMatch[1] });

// "İY 1.5 Üst"
const htOuMatch = value.match(/^İY (\d+\.\d+) (Üst|Alt)$/);

// Kalan literal değerler
const literal = { 'Beraberlik': 'draw', 'Evet': 'yes', 'Hayır': 'no' }[value];
```

## Beklenen Sonuç

Analiz drawer'ı, tahmin kartları, paylaşım kartı, günün maçı kartı, AI öneri kartı ve filtre paneli artık aktif dile göre tüm tahmin metinlerini doğru gösterir. Veritabanı şeması ve doğrulama mantığı değişmez.

## Onay

Onayladıktan sonra build moduna geçip uygulayacağım. Admin paneli ve yasal metinler önceki kararlara göre TR kalır — değişsin isterseniz belirtin.
