
# Premium Sayfa -- 2026 Native UI/UX Yukseltme

Mevcut sayfa iyi bir temel uzerine kurulu (framer-motion, haptics, glassmorphism) ama bazi alanlarda 2026 native standartlarinin gerisinde kaliyor.

## Degisiklikler

### 1. Plan Kartlari -- Horizontal Scroll Carousel
- 3 kart yan yana 390px'de cok sikisik ve 9px fontlar okunmuyor
- Kartlari snap-scroll horizontal carousel'e cevir (popular kart ortada, snap-center)
- Font boyutlarini 12-14px'e yukselterek okunabilirlik sagla
- Her karta glassmorphism background ekle

### 2. PromoBanner -- Emoji Kaldirma
- `⚽` emojisini Lucide icon ile degistir (proje kurali: no emojis)
- Seasonal banner icin `Trophy` veya `Target` icon kullan

### 3. ActivePlanView -- Canlandirma
- Giris animasyonu ekle (staggered fade-in)
- Plan ikonu icin gradient border ve subtle pulse
- Feature grid'e hover/tap scale efekti

### 4. Back Navigation Ekleme
- Secondary page standardi: 44px back button (ArrowLeft)
- AppHeader yerine veya ustune back chevron ekle

### 5. Karsilastirma Tablosu CTA Duzeltme
- Kendine link veren CTA'yi kaldir veya scroll-to-top + plan secimi mantigi ekle

### 6. Trust Badges Responsive
- 4-column'dan 2x2 grid veya horizontal scroll'a gecis
- Font boyutunu 10.5-11px'e yukselterek okunabilirlik

### 7. Loading Skeleton Duzeltme
- `min-h-screen` yerine `h-screen flex flex-col` kullan (proje standardi)

### 8. Period Toggle Iyilestirme
- Hardcoded width hesaplamasini layout-based cozume cevir

## Dokunulmayacaklar
- purchaseService entegrasyonu (calisir durumda)
- i18n yapilandirmasi (mevcut ceviri anahtarlari korunacak, yeniler eklenecek)
- Supabase client/types dosyalari

## Degisecek Dosyalar
- `src/pages/Premium.tsx` -- Plan kartlari carousel, loading skeleton, back nav
- `src/components/premium/PromoBanner.tsx` -- Emoji kaldirma
- `src/components/premium/TrustBadges.tsx` -- Responsive grid
- `src/components/premium/PlanComparisonTable.tsx` -- CTA duzeltme
- `src/i18n/locales/*/premium.json` -- Yeni ceviri anahtarlari (5 dil)
