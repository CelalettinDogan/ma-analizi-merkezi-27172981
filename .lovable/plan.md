

## Plan: Premium Sayfası — 2026 Native Mobile Redesign

### Mevcut Durum
Premium sayfası çalışıyor ama native app hissi vermiyor. Plan kartları sıkışık, CTA alanı karmaşık, genel yerleşim "web sayfası" gibi duruyor.

### Değişiklikler (`src/pages/Premium.tsx`)

Tek dosya, tam yeniden yazım:

**1. Yapı — Tek scroll sayfası**
- `h-screen flex flex-col` + `flex-1 overflow-y-auto` (TabShell uyumlu)
- AppHeader kaldır (gereksiz — TabShell zaten header sağlıyor veya standalone kullanılıyor)
- BottomNav clearance: `paddingBottom: calc(80px + env(safe-area-inset-bottom))`

**2. Hero — Minimal gradient header**
- Crown ikonu + "Premium" başlık + kısa açıklama
- Hafif gradient arka plan (`from-primary/5 via-background to-background`)
- Kompakt: sadece 3 satır, emoji yok

**3. Segmented Control — iOS/Android native toggle**
- Mevcut animated pill toggle'ı koru ama daha geniş yap (tam genişlik yerine `w-fit mx-auto`)
- "2 ay bedava" badge'ini daha temiz göster (emoji kaldır)

**4. Plan Kartları — 3 kolon, daha okunabilir**
- Mevcut grid-cols-3 koru
- Kartları daha tall yap: padding artır, ikon büyüt (`w-10 h-10`)
- Seçili kart: `ring-2 ring-primary` + subtle scale(1.02) animation
- Fiyat: `text-xl font-black tabular-nums`
- Radio dot yerine filled circle + checkmark (daha native)

**5. Feature Chips — Horizontal scroll strip**
- 4 feature'ı yatay pill'ler olarak göster (ikon + kısa etiket)
- `flex overflow-x-auto gap-2 scrollbar-hide`
- Daha kompakt, ekran alanı kazandırır

**6. Fixed CTA — BottomNav üstünde**
- Mevcut yapıyı koru ama:
  - Gradient button shimmer animasyonunu daha subtle yap
  - "Geri yükle" ve legal text'i CTA altında tek satıra sığdır
  - `backdrop-blur-xl` ile premium blur efekti

**7. Already Premium View**
- Mevcut yapıyı koru, sadece spacing optimize et

**Dokunulmayacaklar:**
- Renkler, fonksiyonalite, purchase logic
- `PremiumUpgrade.tsx` component'i (modal/sheet versiyonu — ayrı dosya, dokunma)

