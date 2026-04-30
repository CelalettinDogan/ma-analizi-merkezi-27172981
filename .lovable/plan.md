
# Premium Sayfa -- 2026 Native Capacitor Yukseltmesi

Mevcut sayfayi inceledim. Temel yapi iyi (framer-motion, haptics, carousel) ama gercek bir native uygulama hissi icin asagidaki iyilestirmeler gerekiyor:

---

## 1. BackButton Cakismasi Duzeltme
- BackButton `absolute` konumda ve AppHeader'in ustune biniyor
- AppHeader'in icine entegre edilecek: sol tarafa back chevron, ortaya logo, saga mevcut iconlar
- Premium sayfasinda AppHeader'a `showBack` prop'u gecilecek

## 2. Plan Kartlari -- Tam Genislik Vertical Stack
- 72vw horizontal carousel kucuk ekranlarda (320px) sorun cikarir
- Kartlari dikey stack'e cevir: her biri tam genislikte, secili olan vurgulu
- Popular kart hafif scale(1.02) ve gradient border ile one cikar
- Selection radio indicator yerine tum kart highlight olacak

## 3. Period Toggle -- Layout-based Pozisyonlama
- `calc(50% - 4px)` hardcoded width hesaplamasi yerine grid/flex tabanli cozum
- Her buton `flex-1`, aktif olan `bg-card` ile gecis

## 4. CTA Butonu -- Sticky Bottom
- Scroll ile kaybolmasin, sayfanin altinda sabit kalsin
- `position: sticky` + `bottom: calc(80px + safe-area)` ile bottom nav ustunde
- Glassmorphism backdrop ile icerikten ayrissin

## 5. HeroGlow -- Performans Optimizasyonu
- Surekli framer-motion animasyonu GPU'yu yorar
- CSS `@keyframes` + `will-change: transform` ile degistirilecek
- `prefers-reduced-motion` kontrolu eklenir

## 6. Loading Skeleton -- Shimmer Efekti
- Mevcut skeleton duzgun ama shimmer gradient eksik
- Pulse yerine soldan saga akan gradient shimmer

## 7. Touch/Native Uyumluluk
- Tum butonlara `user-select: none` ve `-webkit-tap-highlight-color: transparent`
- `overscroll-behavior: contain` ana scroll alanina
- Feature pills'e `whileTap={{ scale: 0.95 }}` eklenir

## 8. Spinner Emoji Kaldirma
- Loading state'de `&#9203;` (hourglass emoji) var
- `Loader2` Lucide icon ile degistirilecek (animate-spin)

## 9. Comparison Table -- Unused Navigate Import
- `useNavigate` import edilmis ama CTA kaldirildigi icin kullanilmiyor
- Temizlenecek

---

## Degisecek Dosyalar
- `src/pages/Premium.tsx` -- Vertical plan cards, sticky CTA, spinner fix, touch props
- `src/components/layout/AppHeader.tsx` -- `showBack` prop ekleme
- `src/components/premium/HeroGlow.tsx` -- CSS animasyona gecis
- `src/components/premium/PlanComparisonTable.tsx` -- Unused import temizleme
