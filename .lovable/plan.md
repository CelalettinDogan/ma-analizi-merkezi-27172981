

# Toplam Gol Alt/Ust Tahmin Basarisini Iyilestirme

## Mevcut Sorun Analizi

Veritabani verilerine gore:
- **35 tahmin yapildi, sadece 17 dogru** (%48.57 basari)
- "Alt" tahminlerinde %30 basari (10 tahminde 3 dogru)
- "Ust" tahminlerinde %43 basari (7 tahminde 3 dogru)
- Premium tahminlerde de dusuk: %47

### Kok Nedenler

1. **Matematiksel model cok basit**: Sadece gol ortalamalarinin toplamindan basit bir esik degeri kullaniliyor (`expectedGoals > 2.5` ise Ust). Poisson olasiliklari, takim guc endeksleri ve lig ortalamalari hesaba katilmiyor.

2. **Poisson verisi AI'a yeterince iletilmiyor**: Poisson modeli over2.5 olasiliklarini hesapliyor ama bu deger `prediction_features` tablosunda NULL olarak kaliyior. AI'in gercek matematiksel olasiliklari gormesi gerekiyor.

3. **"Alt" yanilgisi**: Model, beklenen gol 2.0-2.5 arasindayken "Alt" tahmin ediyor. Ancak bu aralik tam sinir noktasi - gercek maclar genellikle 3+ golle bitiyor (Atletico Madrid 4-2, Mallorca 4-1, Real Sociedad 3-3).

4. **Hibrit model dengesizligi**: AI ve matematik tahmini cakistiginda hibrit guven skoru artiriliyor ama her ikisi de ayni yanlis yonde olunca basari dusuk.

## Cozum Plani

### 1. Matematiksel Modeli Guclendir (predictionEngine.ts)

Mevcut basit esik yerine Poisson olasiliklarini dogrudan kullan:

```text
MEVCUT (basit):
  expectedGoals > 2.5 → "Üst"
  expectedGoals <= 2.5 → "Alt"

YENI (Poisson tabanli):
  poissonOver25Prob > %55 → "Üst" (yüksek güven)
  poissonOver25Prob > %50 → "Üst" (orta güven)  
  poissonOver25Prob < %40 → "Alt" (yüksek güven)
  poissonOver25Prob < %45 → "Alt" (orta güven)
  %45-50 arasi → "Alt" (düşük güven) - sinir bolgesinde temkinli ol
```

Buna ek olarak:
- Lig bazli over2.5 yuzdesini kontrol et (league_averages tablosu)
- Takim bazli hucum/savunma guc endekslerini dahil et
- Son 5 macta over2.5 olma oranini hesapla

### 2. AI Prompt'unu Over/Under Icin Zenginlestir (ml-prediction Edge Function)

AI'a gonderilen prompt'a su verileri ekle:
- Poisson modelinin hesapladigi **kesin over2.5 olasiligi** (orn: "%62")
- Lig ortalamasi over2.5 orani
- Her iki takimin son 5 mactaki over2.5 orani
- Ozel talimat: "Poisson over2.5 olasiligi %45-55 arasindaysa SINIR BOLGE - guven seviyesini dusur"

### 3. Sinir Bolgesi Korumasi (useMatchAnalysis.ts)

Poisson over2.5 olasiligi %45-55 arasindayken:
- Guven seviyesini otomatik olarak "dusuk" yap
- AI ve matematik farkli yonde tahmin ediyorsa, Poisson'a oncelik ver
- Hibrit guven skorunu dusurmek icin "belirsiz bolge" flagi ekle

### 4. Tarihsel Dogruluk Geri Bildirimi

AI prompt'una gecmis "Toplam Gol Alt/Ust" basari oranini (%48.57) ekle ve sunu soyle:
"Bu kategoride basarin dusuk. Sinir durumlarda daha temkinli ol ve guven seviyesini dusur."

Bu zaten kismen yapiliyor ama deger AI'a direkt olarak verilecek.

## Teknik Degisiklikler

| Dosya | Degisiklik |
|-------|-----------|
| `src/utils/predictionEngine.ts` | Toplam Gol tahmini icin Poisson olasiligini parametre olarak al, esik degerlerini Poisson tabanliya cevir |
| `src/hooks/useMatchAnalysis.ts` | Poisson over2.5 olasiliklarini predictionEngine'e ilet, sinir bolgesi korumasi ekle |
| `supabase/functions/ml-prediction/index.ts` | AI prompt'una over2.5 olasiligi, lig ortalamasi ve son mac over2.5 oranlari ekle |
| `src/services/mlPredictionService.ts` | getMLPrediction fonksiyonuna over2.5 olasiligini ve lig verisini parametre olarak ekle |

## Beklenen Sonuc

- Sinir bolgesindeki yanlis tahminler azalacak (mevcut yanlis tahminlerin cogu %45-55 arasinda)
- Poisson matematik modelinin kesin olasiliklari AI kararini yonlendirecek
- Guven seviyeleri daha gercekci olacak - "orta" yerine belirsiz durumlarda "dusuk" verilecek
- Hedef: %48 basaridan en az %55-60 arasina cikmak

