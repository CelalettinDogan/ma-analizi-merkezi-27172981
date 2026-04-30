
## Premium Sayfası UI/UX Düzeltmeleri

### 1. Badge Cakismasini Duzelt (PlanCard)
- "Save XX%" badge pozisyonu `right-1.5 -top-2.5` ile Popular badge (`-top-3.5 left-1/2`) cakisiyor
- Popular kartinda savings badge'i kaldirip, sadece plan adi altinda yesil text olarak goster: "Save 32%"
- Non-popular kartlarda badge kalabilir cunku Popular badge yok

### 2. Seasonal Promo Banner Icerigi Guclendir
- Emoji (futbol topu) kaldır (memory: no emojis)
- Yerine futbol sahasi ikonu (lucide `Goal` veya `Trophy`) koy
- Subtitle kismina ne sunuldugunu belirt

### 3. Compare Plans CTA Butonunu Duzelt
- Compare Plans zaten `/premium` sayfasinda, CTA butonu tekrar `/premium?from=compare-X` sayfasina yonlendiriyor (gereksiz navigasyon)
- Yerine sayfa basina scroll yap veya secili plani CTA'ya bagla

### 4. Plan Kartlarinda Fiyat Tasmasini Onle
- Price container'a `overflow-hidden text-ellipsis` ekle
- Min-width: 0 zaten var, ama price text icin `whitespace-nowrap` ile `max-w-full` kombine et

### 5. Dosya Degisiklikleri
- `src/pages/Premium.tsx` — PlanCard savings badge pozisyon duzeltmesi, popular kart icin inline savings
- `src/components/premium/PromoBanner.tsx` — Emoji yerine ikon, no emojis kurali
- `src/components/premium/PlanComparisonTable.tsx` — CTA butonunu scroll-to-top veya secili plani set eden handler'a cevir
