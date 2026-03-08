

# Mobil Production-Ready Audit & Düzeltme Planı

## Genel Değerlendendirme

Mevcut arayüz büyük ölçüde iyi yapılandırılmış. `textZoom: 100` Capacitor ayarı, `text-size-adjust: none`, safe-area padding'ler, `overflow-x: hidden`, `user-select: none` ve `min-width: 0` gibi kritik korumalar zaten mevcut. 320px'de de UI temiz çalışıyor.

Ancak aşağıdaki riskli alanlar tespit edildi:

## Tespit Edilen Sorunlar

### 1. TabShell — `minHeight: 100vh` yerine `height: 100vh` kullanılmalı (KRİTİK)

**Dosya:** `src/components/navigation/TabShell.tsx` satır 134

Mevcut: `minHeight: '100vh'` — bu, içerik tab'ın altındaki BottomNav'ın arkasına doğru uzamasına izin verir ve iç scroll container'lar (`overflow-y-auto`) body seviyesinde scroll yerine kendi içinde scroll yapamaz. Memory'de "height: 100vh + overflow: hidden" olması gerektiği belirtilmiş ama kodda `minHeight` kullanılıyor.

**Düzeltme:** `minHeight: '100vh'` → `height: '100vh'`, `overflow: 'hidden'` ekle. Her tab'ın kendi iç `main` elemanı zaten `flex-1 overflow-y-auto` ile scroll'u yönetiyor.

### 2. Premium Sayfası — `min-h-screen` Layout Sorunu (YÜKSEK)

**Dosya:** `src/pages/Premium.tsx` satır 151

Premium sayfası `min-h-screen` kullanıyor ama TabShell içinde render ediliyor. `h-screen flex flex-col` olması gerekiyor (diğer sayfalarla tutarlı). Ayrıca "Zaten Premium" durumu da aynı sorundan muzdarip (satır 135).

**Düzeltme:** Her iki layout path'i de `h-screen bg-background flex flex-col` kullanmalı; main'e de `overflow-y-auto` + BottomNav safe-area padding eklenmeli.

### 3. LeagueGrid — Tooltip Mobilde Gereksiz DOM (ORTA)

**Dosya:** `src/components/league/LeagueGrid.tsx`

`TooltipProvider` ve `Tooltip` bileşenleri mobilde çalışmaz (hover yok), gereksiz DOM katmanı oluşturur. Memory'de kaldırılması planlanmıştı.

**Düzeltme:** Tooltip sarmalayıcılarını kaldır, `motion.button`'ları doğrudan render et.

### 4. LeagueGrid — `whileHover` Mobilde Gereksiz (DÜŞÜK)

`whileHover={{ scale: 1.02 }}` sadece masaüstü tarayıcıda çalışır, mobilde sticky hover state bırakabilir.

**Düzeltme:** `whileHover` kaldır, sadece `whileTap` bırak.

### 5. LiveMatchCard2 — `whileHover` Mobilde Sorunlu (DÜŞÜK)

**Dosya:** `src/components/live/LiveMatchCard2.tsx` satır 21

`whileHover={cardHover}` ve `hover:border-border` CSS kullanıyor — bu mobilde sticky state yaratır.

**Düzeltme:** `whileHover` kaldır.

### 6. MatchCarousel — Desktop Nav Butonları Gereksiz (DÜŞÜK)

**Dosya:** `src/components/match/MatchCarousel.tsx` satır 194-209

Desktop-only nav butonları `hidden md:flex` ve `group-hover:opacity-100` ile kontrol ediliyor. Bu uygulamanın sadece Android native olduğu düşünüldüğünde tamamen gereksiz DOM.

**Düzeltme:** Desktop nav butonlarını kaldır.

### 7. Chat Sayfası — BottomNav Padding Çakışması (ORTA)

**Dosya:** `src/pages/Chat.tsx` satır 324

Chat sayfası `paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'` kullanıyor, ama chat input zaten `main`'in alt kısmında sticky olarak render ediliyor. Bu çift padding, input'un gereğinden fazla yukarıda kalmasına neden olabilir. Chat sayfası kendi header'ını kullandığı ve BottomNav Chat sayfasında da görünüyor olduğu için bu padding doğru.

Ancak Chat input alanının keyboard açıldığında düzgün çalışması için `Keyboard.resize: 'body'` Capacitor ayarı zaten var — bu kısım sorunsuz.

### 8. Featured Match Card — H2H Badge Taşma Riski (ORTA)

**Dosya:** `src/components/TodaysMatches.tsx` satır 193

Featured match header satırında `justify-between` ile badge ve H2H yan yana. Dar ekranda (320px) uzun bir "Büyük Maç" badge + H2H dots + tarih taşabilir. Memory'de bu düzeltildiği belirtilmiş ama mevcut kodda `flex-wrap` yok.

**Düzeltme:** Header satırına `flex-wrap gap-1.5` ekle.

### 9. `glass-card-hover` — Hover Class'ı Temizle (DÜŞÜK)

**Dosya:** `src/index.css` satır 209-216

`.glass-card-hover:hover` CSS tanımı var — mobilde sticky kalır.

**Düzeltme:** `:hover` → `:active` veya kaldır (kullanılıyorsa kontrol et).

## Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/navigation/TabShell.tsx` | `minHeight` → `height: 100vh`, `overflow: hidden` |
| `src/pages/Premium.tsx` | `min-h-screen` → `h-screen flex flex-col`, main'e safe-area padding |
| `src/components/league/LeagueGrid.tsx` | Tooltip wrapper kaldır, `whileHover` kaldır |
| `src/components/live/LiveMatchCard2.tsx` | `whileHover` kaldır, `hover:` class temizle |
| `src/components/match/MatchCarousel.tsx` | Desktop nav butonları kaldır, `whileHover` temizle |
| `src/components/TodaysMatches.tsx` | Featured header'a `flex-wrap` ekle |
| `src/index.css` | `.glass-card-hover:hover` → `:active` veya media query ile sınırla |

## Capacitor Paketleme Cevabı

> Bu arayüz Capacitor ile paketlenip gerçek Android/iPhone cihazlarda kullanıldığında herhangi bir ekran boyutunda, font büyütme senaryosunda veya uzun içerikte taşma/bozulma üretir mi?

**Font scaling:** `textZoom: 100` ve CSS `text-size-adjust: none !important` ile sistem font ölçeklendirmesi tamamen devre dışı — bu kısım güvenli.

**Ekran boyutu:** 320px'den 414px+'ya kadar test ettim, taşma yok. Ancak TabShell'in `minHeight` sorunu düzeltilmezse, bazı cihazlarda çift scroll (body + container) oluşabilir.

**Premium sayfası:** `min-h-screen` layout'u TabShell içinde sorunlu — düzeltilmeli.

**Hover states:** Android WebView'da hover state sticky kalabilir — yukarıdaki `whileHover` düzeltmeleri uygulanmalı.

Toplam 7 dosya, hepsi küçük ama etkili düzeltmeler.

