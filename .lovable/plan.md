

## Live Ekranı — 2026 Premium Audit

### Mevcut Durum (Ekran İncelemesi)
Sayfa fonksiyonel olarak sağlam. Skeleton loading, lig filtresi, boş durum, hata durumu, accessibility — hepsi yerinde. Ancak birkaç görsel detay native premium hissinden uzak:

### Tespit Edilen Sorunlar

| # | Sorun | Detay |
|---|-------|-------|
| 1 | Header Radio ikonu | `(•))` ikonu + yanındaki kırmızı ping dot fazla kalabalık, premium app'lerde (FotMob/SofaScore) daha minimal |
| 2 | Gecikme banner'ı | `border border-amber-500/15` çerçevesi web hissi veriyor, native app'lerde böyle banner olmaz |
| 3 | Empty state kartı | `border border-border/50` çerçeveli kart web-like görünüyor. Premium app'lerde empty state seamless, border'sız olur |
| 4 | Empty state ikonu | Radio ikonu `w-8 h-8` küçük ve soluk. Daha büyük, daha etkileyici olmalı |
| 5 | Empty state spacing | İkon → başlık → açıklama → buton arası sıkışık |
| 6 | Gecikme banner'ı gereksiz alan kaplıyor | Her zaman görünüyor, maç olsa da olmasa da |

### Önerilen İyileştirmeler

**1. Header Simplification**
- Radio ikonu + ping dot → sadece bir kırmızı dot ile "Canlı Skorlar" yeterli
- Veya ping animasyonunu kaldır, sadece statik kırmızı dot bırak (daha premium, daha az "web")

**2. Gecikme Banner'ını Kaldır veya Küçült**
- Bu banner her zaman görünüyor ve native app'lerde bu tür uyarılar genelde yoktur
- Kaldır veya sadece footer'da çok küçük text olarak göster

**3. Empty State Premium Polish**
- Border'ı kaldır → seamless, `bg-transparent` yap
- İkonu büyüt: `w-12 h-12` ve `text-muted-foreground/30`
- Alt açıklama ile buton arası spacing artır: `mb-8`
- Buton altına küçük destekleyici metin ekle: `"Maçlar başladığında burada görünecek"`

**4. Maç Kartı İyileştirmesi (LiveMatchCard2)**
- Kart zaten iyi durumda, ancak `shadow-sm` → `shadow-[0_2px_12px_-2px_hsl(var(--foreground)/0.06)]` ile daha yumuşak shadow
- CTA bölümünde `border-t` → daha subtle `border-border/10`

### Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `src/pages/Live.tsx` | Header simplify, gecikme banner kaldır/küçült, empty state polish |
| `src/components/live/LiveMatchCard2.tsx` | Shadow ve CTA border ince ayar |

Fonksiyonalite değişmez. Sadece görsel polish.

