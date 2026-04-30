
## "Gunun Yuksek Ihtimalli Skoru" Premium Teaser Bolumu

Ana sayfaya, mevcut `smartPicksService` verisini kullanarak en yuksek confidence'li tahmini gosteren bir kart eklenecek. Free kullanicilar icerik blur'lu gorecek ve premium sayfasina yonlendirilecek.

### Yeni Bilesenler

**1. `src/components/home/DailyTopPrediction.tsx`**

- `getSmartPicks(1)` ile en yuksek confidence'li tahmini ceker
- Iki gorunum modu:
  - **Premium kullanici**: Tam icerik -- takimlar, skor tahmini, confidence yuzdesi, tahmin tipi
  - **Free kullanici**: Ayni kart ama icerik `blur-lg` ile bulanik, uzerinde `PremiumTeaserOverlay` ile "Premium ile Gor" CTA butonu
- Kart tasarimi:
  - Glassmorphism (`bg-card/60 backdrop-blur-sm border border-border/50`)
  - Sol ust: "Gunun Secimi" baslik + Sparkles ikonu
  - Ortada: Takim armalar + isimler + skor tahmini + confidence bar
  - Sag ust: Confidence badge (emerald renk)
- Veri yoksa veya yuklenmiyorsa bilesen render edilmez (graceful hide)
- `useQuery` ile cache'lenir (`staleTime: 5 * 60 * 1000`)

### Entegrasyon

**2. `src/pages/Index.tsx` Guncelleme**

- `DailyTopPrediction` bilesenini `StreakBadge` ile `LeagueGrid` arasina yerlestirir
- `usePlatformPremium` hook'u zaten mevcut -- `isPremium` degeri prop olarak iletilir

### Teknik Detaylar

- Mevcut `smartPicksService.ts` ve `PremiumTeaserOverlay.tsx` yeniden kullanilir
- Ek API cagrisi yok -- DB'deki predictions tablosundan cekilir
- i18n: `src/i18n/locales/tr/home.json` ve diger dillere `dailyPick` keyleri eklenir
- Tasarim: 8px grid, 12px radius, emerald/amber renk sistemi, `motion` animasyonlari
- Premium kontrol: `usePlatformPremium().isPremium` ile
