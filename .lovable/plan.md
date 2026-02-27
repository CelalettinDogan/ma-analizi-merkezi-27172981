

# 2026 AI Premium UI Dönüşüm Planı

Uygulamayı modern AI startup ürünü seviyesine çıkaracak 5 ana değişiklik.

---

## 1. Hero Section — AI Premium Hissiyat

**Dosya:** `src/components/HeroSection.tsx`

- **Arka plan:** Mevcut düz gradient yerine çoklu radial gradient mesh (circle_at_30%_20%, circle_at_70%_60%) + çok hafif grid pattern overlay (48px grid, opacity 3%)
- **Trust badge:** Düz `rounded-full` chip yerine glassmorphism chip: `bg-card/60 backdrop-blur-md border-border/40 shadow-subtle rounded-2xl` + içinde Shield icon'lu küçük kutu (`w-6 h-6 rounded-lg bg-emerald-500/15`)
- **Başlık:** `text-3xl sm:text-4xl` + `gradient-text` class ile AI ile Analiz kısmı gradient
- **CTA butonu:** `bg-gradient-to-r from-primary to-emerald-500` + `shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.4)]` + shimmer overlay (via-white/10 translate animation) + `whileTap={{ scale: 0.97 }}` + `whileHover={{ scale: 1.02 }}`
- **Futbol emoji animasyonu kaldır** — profesyonel olmayan hissiyat veriyor

## 2. LeagueGrid — Snap Scroll + Glow

**Dosya:** `src/components/league/LeagueGrid.tsx`

- **Tooltip sarmalı kaldır** — mobilde gereksiz
- **Chevron scroll hint kaldır** — web pattern'i
- **Snap scroll:** `snap-x snap-mandatory` + her butona `snap-start`
- **Aktif lig:** `shadow-[0_0_20px_-4px_hsl(var(--primary)/0.35)] scale-[1.03]` glow efekti
- **Pasif lig:** `bg-card/60 backdrop-blur-sm border-border/30` glassmorphism
- **Live badge:** Ayrı Badge component yerine inline `w-1.5 h-1.5 bg-destructive rounded-full animate-pulse` ile minimal dot + sayı

## 3. Maç Kartları — Elevation + Hiyerarşi

**Dosyalar:** `src/components/TodaysMatches.tsx`, `src/components/match/MatchCarousel.tsx`

### TodaysMatches:
- **Featured card:** `bg-card/50 backdrop-blur-md border-border/20 shadow-card` + inner shine gradient (`from-primary/[0.03]`)
- **Crest boyutu:** `w-10 h-10` → `w-12 h-12 rounded-2xl` — daha görünür
- **Saat:** `text-xl font-display font-bold` — merkez odak noktası
- **Maç listesi:** Ayrı satırlar yerine tek `rounded-2xl bg-card/30 backdrop-blur-sm border-border/10 divide-y divide-border/10` container içinde
- **Loading overlay:** `bg-background/60 backdrop-blur-sm` + pill içinde spinner
- **Skeleton:** Yapısal skeleton (kart şeklinde) mevcut düz dikdörtgen yerine

### MatchCarousel:
- **Kart:** `bg-card/40 backdrop-blur-md border-border/15 shadow-subtle hover:shadow-card`
- **Snap scroll:** `dragFree: false` (snap behavior)
- **Fade edge kaldır** — iOS'ta native olmayan pattern

## 4. BottomNav — Floating Pill + Glow

**Dosya:** `src/components/navigation/BottomNav.tsx`

### Flicker Fix (Admin/Premium):
- Mevcut `useRef` stableItems pattern'i yerine `useState` ile role state'i sadece `!isLoading` olduğunda güncelle
- İlk render'da `stableRole = null` → default olarak free user items göster (Premium tab dahil)
- `isLoading` bitince gerçek role ile güncelle — tek seferde, flicker yok

### Tasarım:
- **Container:** `fixed bottom-0 px-4 pb-[max(8px,env(safe-area-inset-bottom))]` + iç pill: `bg-card/80 backdrop-blur-2xl border-border/30 rounded-[20px] shadow-elevated max-w-md mx-auto`
- **Top shine:** `h-px bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent`
- **Aktif tab:** `layoutId="activeTab"` + `boxShadow: 0 0 16px -2px hsl(var(--primary)/0.2)` glow + `scale: 1.1` icon animation
- **Premium badge:** Mevcut yıldız + gradient circle → minimal `w-2.5 h-2.5` gradient dot
- **Gradient fade kaldır** — üstteki `bg-gradient-to-t` gereksiz, floating pill zaten bağımsız

## 5. AppHeader + Micro-interactions

**Dosya:** `src/components/layout/AppHeader.tsx`
- **Blur artır:** `backdrop-blur-lg` → `backdrop-blur-2xl`
- **Border azalt:** `border-border/40` → `border-border/20`
- **Background:** `bg-background/95` → `bg-background/80`
- **Logo hover glow kaldır** — basit `group-active:scale-95` press efekti yeterli

**Genel spacing (Index.tsx):**
- `pb-24` → `pb-28` (floating nav için daha fazla alan)
- Section arası `space-y-8` korunur (32px = 8px grid x 4)

---

## Teknik Detaylar

- Tüm arbitrary pixel değerler (`text-[7px]`, `min-w-[56px]` vb.) token'larla değiştirilecek
- Framer Motion `whileTap` tüm interaktif elementlerde tutarlı: kartlar `0.98`, butonlar `0.97`, nav items `0.9`
- CSS custom property bazlı shadow'lar kullanılacak (`shadow-subtle`, `shadow-card`, `shadow-elevated`)
- `font-display` (Space Grotesk) tüm section başlıklarında ve saat gösterimlerinde zorunlu

