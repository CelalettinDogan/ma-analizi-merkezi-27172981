

## Plan: Premium Screen — Final 2026 Native Polish

### Değişiklikler (`src/pages/Premium.tsx`)

**1. Card Hierarchy & Depth**
- Popular (Plus) card: `scale-[1.05]` ekle, shadow'u güçlendir: `shadow-[0_12px_48px_-8px_hsl(var(--primary)/0.25)]`
- Side cards: `opacity-90` ekle, shadow hafif: `shadow-[0_2px_12px_-2px_hsl(var(--foreground)/0.06)]`
- Selected non-popular card'a orta seviye shadow

**2. Popüler Badge Glow**
- Shadow'u güçlendir: `shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.5)]`
- `ring-2 ring-primary/20` ile soft glow efekti

**3. CTA Button Enhancement**
- Gradient: `from-primary via-emerald-600 to-emerald-500` (daha depth)
- Shadow: `shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.45)]`
- `whileTap={{ scale: 0.95 }}` (daha belirgin tap)

**4. Urgency Text**
- CTA üstüne: `⚡ Sınırlı teklif: 2 ay ücretsiz` (yearly seçiliyken)
- `text-amber-600 font-semibold text-xs` animasyonlu

**5. Social Proof Güçlendirme**
- Trust text'i: "10.000+ kullanıcı GolMetrik AI Premium kullanıyor"
- Background card ile vurgula: `bg-muted/30 rounded-xl p-3`

**6. Feature Pills**
- Padding artır: `px-4 py-2.5`
- Border ekle: `border border-primary/10`
- Gap artır: `gap-2.5`

**7. Spacing**
- Ana container `space-y-6` → `space-y-7`
- Plan cards üstü `pt-2` → `pt-3`
- Feature pills ve trust arası breathing room

**8. Card Internal Padding**
- `px-1.5 pb-4` → `px-2.5 pb-5`
- `pt-5/pt-4` → `pt-6/pt-5`

Tek dosya değişikliği. Fonksiyonalite değişmez.

