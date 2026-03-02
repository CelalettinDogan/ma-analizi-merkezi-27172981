

# Font Scaling Safe — Tüm Uygulama

Samsung ve diğer Android cihazlarda sistem font boyutu %150'ye çıkarıldığında layout'un kırılmaması için kapsamlı düzeltmeler.

## Sorun Analizi
- `h-14`, `h-12`, `h-10` gibi sabit yükseklikler font büyüdüğünde içeriği taşırıyor
- `w-[260px]` gibi hardcoded genişlikler dar ekranlarda horizontal scroll oluşturuyor
- `whitespace-nowrap` ve `truncate` kombinasyonları font scaling'de sorunlu
- `text-[10px]` gibi sabit font boyutları scaling ile okunamaz hale geliyor
- `overflow-hidden` olan container'larda metin kesiliyor

## Yapılacak Değişiklikler

### 1. Global CSS — `index.css` ve `index.html`
- `html` ve `body`'ye `-webkit-text-size-adjust: 100%; text-size-adjust: 100%;` ekle
- `overflow-x: hidden` ekle (body seviyesinde horizontal scroll engeli)
- Global `word-break: break-word; overflow-wrap: break-word;` base layer'a ekle
- `* { min-width: 0; }` ekle (flex/grid taşma önlemi)

### 2. Button Bileşeni — `button.tsx`
- Tüm size varyantlarında `h-*` → `min-h-*` dönüşümü
- Default: `min-h-[2.5rem]` (40px), sm: `min-h-[2.25rem]`, lg: `min-h-[3rem]`, xl: `min-h-[3.5rem]`, icon: `min-h-[2.5rem]`
- `whitespace-nowrap` kaldır, `whitespace-normal` ekle
- `h-auto` ekle ki font büyüdüğünde buton genişlesin

### 3. AppHeader — `AppHeader.tsx`
- `h-14` → `min-h-[3.5rem]` (header yüksekliği esnesin)
- Logo `w-10 h-10` → `w-10 h-10 shrink-0` (zaten var, korunacak)

### 4. BottomNav — `BottomNav.tsx`
- `min-h-[48px]` zaten var, iyi
- `text-[10px]` → `text-micro` (rem-based, scaling'e uyumlu)
- Icon boyutları `w-[22px] h-[22px]` → `w-5 h-5` (rem-based)

### 5. MatchCarousel — `MatchCarousel.tsx`
- `w-[260px] md:w-[300px]` → `w-[72vw] max-w-[300px] min-w-[240px]` (viewport-relative)
- Skeleton aynı şekilde güncelle

### 6. Auth Sayfası — `Auth.tsx`
- Input'lardaki `h-12`, `h-10` → `min-h-[3rem]`, `min-h-[2.5rem]`
- `overflow-hidden` → `overflow-y-auto` (form uzadığında scroll edilebilsin)

### 7. Profile Sayfası — `Profile.tsx`
- Avatar `h-12 w-12` → `h-12 w-12 shrink-0` (zaten var)
- Tüm metin alanlarında `break-words` ekle

### 8. ChatInput — `ChatInput.tsx`
- `h-11 w-11` send butonu → `min-h-[2.75rem] min-w-[2.75rem]`
- `min-h-[48px]` textarea zaten var, korunacak

### 9. LiveMatchCard — `LiveMatchCard.tsx`
- `min-w-[40px]` skor alanı → `min-w-[2.5rem]` (rem-based)
- `text-3xl` skor font → korunacak (scaling ile orantılı büyür)

### 10. PremiumUpgrade — `PremiumUpgrade.tsx`
- Plan butonlarındaki `w-8 h-8` → `w-8 h-8 shrink-0`
- `grid-cols-3` plan grid → `grid-cols-3` korunacak ama `gap-2` → `gap-1.5` ve içerik `break-words`

### 11. LeagueGrid — `LeagueGrid.tsx`
- Zaten `flex-shrink-0` ve `whitespace-nowrap` — korunacak (horizontal scroll karusel doğası gereği)

### 12. TodaysMatches — `TodaysMatches.tsx`
- `w-10` saat alanı → `shrink-0` zaten var
- Team name alanlarında `break-words` ve `min-w-0` zaten var — korunacak

### 13. Tailwind Config — `tailwind.config.ts`
- Font boyutları zaten `rem` tabanlı — değişiklik gerekmez

## Teknik Detaylar

Değişikliklerin çoğu 3 kategoride:

1. **`h-X` → `min-h-X h-auto`**: Sabit yükseklikleri minimum yüksekliğe çevir, `h-auto` ile büyümeye izin ver
2. **`px` → `rem`**: Pixel-based boyutları rem-based'e çevir (font scaling ile orantılı)
3. **Global korumalar**: `overflow-x: hidden`, `min-width: 0`, `word-break`, `text-size-adjust`

Toplam ~13 dosyada düzenleme yapılacak. Mevcut görsel tasarım korunacak, sadece font scaling dayanıklılığı eklenecek.

