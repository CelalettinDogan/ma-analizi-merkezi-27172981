## Gunun Skor Tahmini -- Mac Listesine Tasima

Standalone `DailyTopPrediction` kartini kaldiracak, yerine mac listesinin 2. satirinda (ilk normal mactan sonra) ayni boyutta bir "Gunun Skor Tahmini" satiri gosterilecek.

### Degisiklikler

**1. `src/pages/Index.tsx`**
- `DailyTopPrediction` import ve kullanimini kaldir
- `TodaysMatches`'e `isPremium` prop'u ekle

**2. `src/components/TodaysMatches.tsx`**
- `isPremium` prop'u ekle
- `smartPicksService` icin `useQuery` ekle (daily-top-prediction, limit 1)
- Mac listesi render'inda (`displayedMatches.map` icinde), `index === 0` satirindan sonra (yani 2. sirada) ozel bir "Gunun Skor Tahmini" satiri ekle
- Bu satir normal mac satiriyla ayni boyutta olacak (`grid grid-cols-[1fr_auto_1fr]`, `min-h-[48px]`, ayni padding/radius)
- Icerik: Takim isimleri + skor tahmini gosterilecek ama tamamina `blur-sm` uygulanacak
- Uzerinde kucuk bir `PremiumTeaserOverlay` veya basit bir kilit ikonu + "Premium ile Gor" CTA'si
- Premium kullanicilar icin blur kalkar, tahmin gorunur
- Veri yoksa bu satir render edilmez

**3. `src/components/home/DailyTopPrediction.tsx`**
- Dosya silinecek (artik kullanilmiyor)

**4. i18n Guncelleme**
- `dailyPick.title` -> "Gunun Skor Tahmini" olarak guncelle (tr, en, de, es, ar)

### Teknik Detaylar
- Satir tasarimi: Normal mac satiriyla birebir ayni grid yapisi, sadece icerik blurlu
- Sol: Ev sahibi takim, Orta: skor tahmini + kilit ikonu, Sag: Deplasan takim
- Free kullanicilarda `blur-sm` + navigate('/premium') onClick
- Premium kullanicilarda tam gorunum, tiklandiginda analiz baslatilmaz (sadece bilgi)
- Glassmorphism border ile ayrismasi icin hafif `border-primary/20` eklenir
