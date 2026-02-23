

# ML Model ve Matematik Hesaplamasi Iyilestirme Plani

## Tespit Edilen Sorunlar

### 1. Poisson Verisi Veritabanina Kaydedilmiyor (Kritik)
`prediction_features` tablosundaki `poisson_home_expected` ve `poisson_away_expected` sutunlari tamamen NULL. `createFeatureRecord` (featureExtractor.ts) fonksiyonu bu alanlari icermiyor, sadece `createAdvancedFeatureRecord` (advancedFeatureExtractor.ts) iceriyor -- ama `useMatchAnalysis.ts` eski `createFeatureRecord`'u kullaniyor.

**Cozum:** `useMatchAnalysis.ts`'de Poisson degerlerini feature record'a ekle.

### 2. Mac Sonucu Tahmini Cok Basit (%51.72)
Mevcut mantik sadece `formScore + homeAdvantage - awayFormScore` farkina bakiyor (basit lineer esik). Poisson modelinin hesapladigi mac sonucu olasiliklari (`homeWin%`, `draw%`, `awayWin%`) hic kullanilmiyor.

**Cozum:** `predictionEngine.ts`'de mac sonucu tahminine Poisson olasilik verilerini parametre olarak ekle. Poisson homeWin > %50 ise yuksek guvenle ev sahibi, %40-50 ise orta guven, %30-40 ise dusuk guven. Beraberlik icin drawProb > %30 kontrolu ekle.

### 3. Karsillikli Gol Basit Boolean Kontrolu (%65.96)
Mevcut `bothTeamsScoreProb` sadece gol ortalamalarinin belirli esikleri gecip gecmedigine bakiyor. Poisson BTTS olasiligi (`bttsProbability`) hesaplaniyor ama predictionEngine'e iletilmiyor.

**Cozum:** Poisson BTTS olasiligini parametre olarak al. bttsProb > %60 ise "Evet" yuksek guven, < %40 ise "Hayir" yuksek guven, %40-60 arasi ise sinir bolgesi.

### 4. Ilk Yari Tahmini Cok Kaba
Sadece `scoreDiff > 15` kontrolu var. Hicbir istatistiksel model yok.

**Cozum:** Ilk yari icin yarim Poisson modeli uygula: beklenen gollerin %40-45'i ilk yarisinda atilir. `expectedHomeGoals * 0.42` ve `expectedAwayGoals * 0.42` ile ilk yari Poisson hesapla.

### 5. Dogru Skor Basit Yuvarlama (%0)
`Math.round(homeExpectedGoals)` yapiliyor. Poisson'un en olasilikli skorlarini kullanmiyor.

**Cozum:** Poisson `mostLikelyScores` verisini predictionEngine'e ilet, ilk skoru tahmin olarak kullan.

### 6. Poisson Modeline Dixon-Coles Duzeltmesi Eksik
Standart Poisson modeli dusuk skorlu sonuclari (0-0, 1-0, 0-1, 1-1) hafife aliyor. Dixon-Coles duzeltme faktoru bu sorunlu bolgede daha dogru olasiliklar uretir.

**Cozum:** `poissonCalculator.ts`'e Dixon-Coles rho duzeltmesi ekle (toplam gol <= 1 olan sonuclarda).

### 7. Ev/Deplasman Ayrimli Veri Kullanilmiyor
Lig ortalamalari `leagueAvgScored` olarak tek bir deger kullaniliyor. Oysa `league_averages` tablosunda `avg_home_goals` ve `avg_away_goals` ayri tutulur.

**Cozum:** `useMatchAnalysis.ts`'de `league_averages` tablosundan `avg_home_goals` ve `avg_away_goals` degerlerini cek, Poisson modeline ilet.

## Teknik Degisiklikler

| Dosya | Degisiklik |
|-------|-----------|
| `src/utils/poissonCalculator.ts` | Dixon-Coles rho duzeltmesi ekle |
| `src/utils/predictionEngine.ts` | Mac sonucu, BTTS, ilk yari ve dogru skor icin Poisson verilerini parametre olarak al ve karar mantigini guncelle |
| `src/hooks/useMatchAnalysis.ts` | (1) Poisson verilerini predictionEngine'e ilet (2) Feature record'a Poisson degerlerini kaydet (3) league_averages'dan home/away ortalamalarini cek |
| `src/utils/featureExtractor.ts` | `createFeatureRecord`'a Poisson alanlari ekle |

## Detayli Degisiklikler

### poissonCalculator.ts - Dixon-Coles Duzeltmesi

Dixon-Coles, dusuk gol senaryolarinda (0-0, 1-0, 0-1, 1-1) bir duzeltme faktoru (rho) uygular:
- 0-0: olasilik *= 1 + rho * lambda * mu  
- 1-0: olasilik *= 1 - rho * mu
- 0-1: olasilik *= 1 - rho * lambda
- 1-1: olasilik *= 1 + rho

rho genelde -0.05 ile -0.15 arasinda. Varsayilan -0.1 kullanilacak.

### predictionEngine.ts - Genisletilmis Parametreler

`AnalysisInput` arayuzune yeni alanlar:
```text
poissonHomeWinProb?: number   // 0-100
poissonDrawProb?: number      // 0-100
poissonAwayWinProb?: number   // 0-100
poissonBttsProb?: number      // 0-100
poissonMostLikelyScore?: { home: number, away: number }
poissonFirstHalfHome?: number // ilk yari beklenen ev golu
poissonFirstHalfAway?: number // ilk yari beklenen dep golu
```

**Mac Sonucu yeni mantik:**
```text
poissonHomeWin > 55 → Ev Kazanir (yuksek)
poissonHomeWin > 45 → Ev Kazanir (orta)
poissonDraw > 30 ve en yuksek → Beraberlik (orta)
poissonAwayWin > 55 → Dep Kazanir (yuksek)
poissonAwayWin > 45 → Dep Kazanir (orta)
Hicbiri net degil → en yuksek olasilikli sonuc (dusuk guven)
```

**BTTS yeni mantik:**
```text
bttsProb > 65 → Evet (yuksek)
bttsProb > 55 → Evet (orta)
bttsProb < 35 → Hayir (yuksek)
bttsProb < 45 → Hayir (orta)
%45-55 → sinir bolgesi (dusuk)
```

**Dogru Skor:** Poisson'un en olasilikli skoru kullanilacak.

**Ilk Yari:** Beklenen gollerin %42'si ile yari-Poisson hesap. Fark > 0.3 ise o takim, degilse beraberlik.

### useMatchAnalysis.ts - Veri Akisi

1. `league_averages` tablosundan `avg_home_goals` ve `avg_away_goals` cek
2. Poisson sonuclarini (matchResultProbs, bttsProb, mostLikelyScores) `generatePrediction`'a ilet
3. Feature record'a `poisson_home_expected` ve `poisson_away_expected` degerlerini ekle

## Beklenen Iyilesmeler

- **Mac Sonucu:** %51 → %55-60 (Poisson olasiliklari form skorundan daha guvenilir)
- **Toplam Gol:** %48 → %55-60 (zaten son degisiklikle Poisson eklendi, sinir bolgesi korumasi var)
- **Karsillikli Gol:** %65 → %68-72 (Poisson BTTS olasiligi daha hassas)
- **Dogru Skor:** %0 → %8-12 (Poisson en olasilikli skor, ama bu kategori dogasi geregi dusuk kalir)
- **Ilk Yari:** Yeterli veri yok ama yari-Poisson mantik daha saglikli
- **Ogrenme dongusu:** Poisson verileri artik kaydedilecek, ileride model kalibrasyonu yapilabilir

