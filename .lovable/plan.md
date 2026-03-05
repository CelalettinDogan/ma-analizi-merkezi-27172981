

# Logo Değişikliği Planı

## Yapılacaklar

1. **Yeni logoyu projeye kopyala**: `user-uploads://logo_1x1.png` → `src/assets/logo.png` (mevcut dosyanın üzerine yaz)

2. **Public klasöründeki ikonları güncelle**: Aynı görseli şu dosyalara da kopyala:
   - `public/favicon.png`
   - `public/logo-192.png`
   - `public/logo-512.png`
   - `public/apple-touch-icon.png`
   - `public/logo.png`

3. **Auth sayfasında stil düzeltme** (`src/pages/Auth.tsx`):
   - `rounded-2xl` → `rounded-2xl` kalabilir ama `object-cover` → `object-contain` olarak değiştirilmeli (yeni logo beyaz arka planlı, kırpılmamalı)

4. **Header'da stil kontrolü** (`src/components/layout/AppHeader.tsx`):
   - Mevcut `object-contain rounded-xl` zaten uygun, değişiklik gerekmeyebilir

5. **Footer'da stil kontrolü** (`src/components/layout/AppFooter.tsx`):
   - Mevcut `object-contain rounded-xl` zaten uygun

Yeni logo beyaz arka planlı ve taçlı futbol topu içeriyor. Tüm kullanım yerlerinde `object-contain` ile 1:1 aspect ratio korunacak, `bg-transparent` ile temiz görünecek.

## Değişecek Dosyalar
- `src/assets/logo.png` (üzerine yaz)
- `public/favicon.png`, `public/logo-192.png`, `public/logo-512.png`, `public/apple-touch-icon.png`, `public/logo.png` (üzerine yaz)
- `src/pages/Auth.tsx` (object-cover → object-contain)

