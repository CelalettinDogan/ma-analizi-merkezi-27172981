
# Sampiyonlar Ligi (CL) Maclarinin Analiz Edilememesi Sorunu

## Sorun
Galatasaray vs Juventus gibi CL maclari analiz edilemiyor cunku:
1. `sync-standings` edge function'i CL'yi desteklemiyor (sadece PL, BL1, PD, SA, FL1)
2. CL'de geleneksel lig tablosu yok (play-off/grup formati)
3. `useMatchAnalysis` hook'u takimlari puan durumundan ariyor - CL icin bos donuyor
4. Sistem "Takim Bulunamadi" toast'i gostererek mock veriye dusuyor

## Cozum Yaklasimi
CL maclari icin takimlarin ait oldugu ulke liglerinden (PL, BL1, PD, SA, FL1) puan durumu verisini kullanmak. Ornegin:
- Galatasaray SK -> Turkiye ligi (API'de yok, ozel isleme ihtiyaci var)
- Juventus FC -> Serie A (SA) puan durumundan cekilebilir

### Adim 1: `useMatchAnalysis.ts` - CL icin cross-league standings lookup
CL maclarinda takimlar bulunamadiginda, tum desteklenen liglerin puan durumundan takimlari aramak:

```text
// Eger competition CL ise ve takimlar bulunamadiysa
// Tum liglerin standings'lerini paralel olarak cek
// Her iki takimi da bulmaya calis
```

### Adim 2: Eger takimlar hicbir ligde bulunamazsa (ornegin Galatasaray - Turk ligi API'de yok)
Bu durumda sadece H2H verisi + Poisson hesaplamasi kullanilarak kismi analiz yapmak. Puan durumu olmadan da:
- H2H API verisi zaten geliyor (network log'larda gorunuyor)
- AI (Gemini) tahmini yine calisabilir
- Mock yerine "sinirli veri ile analiz" modu olusturmak

### Yapilacak Degisiklikler

#### Dosya: `src/hooks/useMatchAnalysis.ts`

1. CL maclari icin `analyzeMatch` fonksiyonuna yeni bir dal eklenecek
2. `homeStanding` veya `awayStanding` bulunamadiginda, diger liglerde arama yapilacak
3. Hala bulunamazsa (Galatasaray gibi API'de olmayan takimlar icin), H2H + AI tabanli kismi analiz olusturulacak
4. Mock veriye dusmek yerine, mevcut veriyle (H2H, AI) anlamli bir analiz sunulacak

#### Teknik Detaylar

```text
// Mevcut akis (satir 84-115):
const [standings, recentMatches] = await Promise.all([...]);
const homeStanding = standings.find(...);
const awayStanding = standings.find(...);
if (!homeStanding || !awayStanding) -> mock fallback

// Yeni akis:
1. CL ise -> tum liglerin standings'lerini cek
2. Takimlari tum liglerde ara
3. Bulunamazsa -> "limitedAnalysis" modu:
   - H2H verisini kullan (zaten matchId ile geliyor)
   - AI tahminini (ml-prediction) yine cagir
   - Poisson hesaplamasini ortalama degerlerle yap
   - Kullaniciya "sinirli veri ile analiz" bilgisi goster
```

Bu degisiklikle Galatasaray vs Juventus ve diger CL maclari analiz edilebilir hale gelecek.
