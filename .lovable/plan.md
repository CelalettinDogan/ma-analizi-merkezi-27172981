

# Bottom Navigation — Premium Native Yeniden Tasarım

## Mevcut Durum
Ekran görüntüsünde görüldüğü gibi BottomNav çalışıyor ama:
- Active state çok zayıf (sadece renk + hafif bg)
- İkonlar ince ve generic
- AI sekmesi diğerlerinden ayırt edilemiyor
- Touch feedback sadece global CSS opacity ile sağlanıyor
- Genel hissiyat "web template" kalitesinde

## Yapılacak Değişiklikler

**Tek dosya:** `src/components/navigation/BottomNav.tsx`

### 1. Active State — Pill Indicator
- Aktif sekme ikonu üstüne **compact pill background** (`bg-primary/12 rounded-full px-4 py-1.5`) ekle
- Pill sadece ikon etrafını sarsın, tüm hücreyi değil — iOS/Android native tab bar gibi
- `layoutId="navPill"` ile sekmeler arası smooth animasyon
- Aktif ikon: `strokeWidth: 2.25`, `fill: currentColor`, `fillOpacity: 0.2`
- Pasif ikon: `strokeWidth: 1.8`, renk `text-muted-foreground/60`

### 2. AI Tab Vurgulama
- AI sekmesi (Sparkles) aktif olmasa bile `text-primary/80` ile hafif renk farkı
- AI aktifken pill background'a subtle gradient: `bg-gradient-to-r from-primary/15 to-primary/8`
- Premium badge varsa ikon yanında küçük dot indicator

### 3. Touch Feedback — Framer Motion
- `whileTap={{ scale: 0.92 }}` ile anında press feedback
- `transition: { duration: 0.1 }` — hızlı ve native hissiyat
- Global CSS `button:active { opacity: 0.85 }` zaten var, motion scale bunu tamamlar

### 4. Spacing & Ergonomi
- İkon boyutu: `w-[22px] h-[22px]` (24'ten küçült — pill ile birlikte daha dengeli)
- İkon-label gap: `gap-0.5` (1'den 0.5'e — daha sıkı)
- Label: `text-[10px]` korunur, aktif `font-semibold`, pasif `font-medium`
- Nav yüksekliği: `py-1` (1.5'ten düşür — daha kompakt)
- Min touch target `min-h-[52px]` korunur

### 5. Container Güncellemesi
- Border: `border-t border-border/20` (daha subtle)
- Background: `bg-card/98 backdrop-blur-3xl` (daha solid, daha az şeffaf)
- Üst kenar shadow: `shadow-[0_-1px_3px_rgba(0,0,0,0.04)]` — hafif elevation

### 6. Hover Kaldırma
- Hiçbir hover state yok — tamamen touch-first
- Tüm transition'lar 100-150ms — native hızında

## Görsel Sonuç
```text
┌──────────────────────────────────┐
│  ┌──────┐                        │
│  │🏠 Ana │  📡    ✨    📊  👑  👤  │
│  └──────┘ Canlı  AI   Lig  Pro Profil│
│   pill bg   muted colors          │
└──────────────────────────────────┘
```

Active tab'ın ikonu pill içinde, diğerleri düz — tek bakışta hangi sayfada olduğun belli.

