
## Plan: Premium Score Highlight Row + Streak Badge Inline

### 1. StreakBadge'i HeroSection icerisine tasima

Suanki durumda `StreakBadge` ana sayfada ayri bir `div` icinde duruyor (satir 293-295) ve asagi itiyor. Bunu `HeroSection` icerisindeki accuracy ring satirina entegre edecegiz — ring'in solunda veya ustunde kompakt sekilde gorunecek. `Index.tsx`'deki ayri StreakBadge div'i kaldirilacak.

**Degisiklikler:**
- `HeroSection.tsx`: StreakBadge import edilip accuracy row'unun icine yerlestirilecek (ring yaninda veya stats satirinda)
- `Index.tsx`: Satir 293-295'teki bagimsiz `StreakBadge` div'i kaldirilacak

### 2. "Gunun Yuksek Ihtimalli Skoru" premium-only blur satiri

Maclarin listesinde (TodaysMatches), Featured Match Card'in hemen altina veya match list'in en ustune yeni bir satir eklenecek. Bu satir:

- Mevcut analiz verilerinden (cached AI preview) en yuksek confidence'a sahip macin skor tahminini gosterecek
- **Premium kullanicilar**: Skoru net gorebilecek (ornegin "Liverpool 2-1 Arsenal - %78")
- **Free/Guest kullanicilar**: Icerik `blur-sm` CSS ile bulanik gosterilecek, ustunde kucuk bir kilit ikonu ve "Premium ile gor" butonu olacak. Butona tiklayinca `/premium` sayfasina yonlendirilecek

**Yeni bilesenler:**
- `src/components/premium/HighConfidenceScoreRow.tsx`: Blurlu/acik skor satiri. `usePlatformPremium` ile premium kontrolu yapar. Premium degilse blur + overlay + navigate('/premium') CTA gosterir.

**Entegrasyon:**
- `TodaysMatches.tsx`: Featured card'dan sonra, match list'ten once `HighConfidenceScoreRow` renderlanacak. `matches` prop'undan en yuksek confidence'li maci secmek icin `useMatchAIPreview` kullanilacak.

**Tasarim:**
- Mevcut Surface/card stiline uygun, 8px grid, rounded-xl
- Blur efekti: `filter: blur(6px)` + gradient overlay
- Kilit ikonu + "Premium ile Gor" CTA butonu
- Dark theme uyumlu, glassmorphism border

### 3. i18n desteği

Tum diller icin (tr, en, de, es, ar) `home.json` dosyalarina yeni key'ler eklenecek:
- `todays.highConfidence` — bolum baslik/label
- `todays.unlockWithPremium` — CTA metni

### Dosya ozeti

| Dosya | Islem |
|-------|-------|
| `src/components/premium/HighConfidenceScoreRow.tsx` | Yeni |
| `src/components/HeroSection.tsx` | StreakBadge entegrasyonu |
| `src/components/TodaysMatches.tsx` | HighConfidenceScoreRow ekleme |
| `src/pages/Index.tsx` | Bagimsiz StreakBadge div'i kaldirma |
| `src/i18n/locales/*/home.json` (5 dil) | Yeni key'ler |
