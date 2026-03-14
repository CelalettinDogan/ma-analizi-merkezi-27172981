

## Plan: Accuracy Ring — Native Premium Orantılı Tasarım

### Sorun
`%61` yazısı 40x40px SVG ring içinde `text-xs` ile sıkışık duruyor. Yüzde işareti (`%`) + sayı birlikte dar alana zorlanıyor — native app'lerdeki gibi orantılı ve okunabilir değil.

### Değişiklikler (`src/components/HeroSection.tsx`)

**Ring boyutunu büyüt ve tipografiyi düzelt:**
- Ring: `w-10 h-10` → `w-11 h-11`, viewBox `44x44`, radius `18`
- Stroke genişliği: `2.5` → `3` (daha kalın, daha premium)
- Sayı: `text-xs` → `text-[13px] leading-none font-extrabold` (sadece sayı, büyük ve net)
- `%` işaretini sayıdan ayır: `%` ayrı `text-[8px] font-semibold` span olarak sayının üstüne veya yanına yerleştir
- `tabular-nums` koru (sayı değişirken layout kaymasın)
- Ring progress çizgisine `will-change-[stroke-dashoffset]` ekle

Bu şekilde sayı ring içinde orantılı, net ve premium görünecek — FotMob/SofaScore tarzı compact accuracy badge.

