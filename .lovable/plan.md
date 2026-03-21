

## Plan: Premium Sayfası — Tek Ekran, Scroll'suz Native Layout

### Sorun
Mevcut tasarımda içerik `overflow-y-auto` ile scroll gerektiriyor. Trust items, feature pills ve CTA butonu alt kısımda kalıyor. Mobil app'te bu sayfa scroll ettirmeden tek ekrana sığmalı — Spotify/Revolut abonelik ekranları gibi.

### Yaklaşım
Tüm içeriği viewport yüksekliğine sığdırmak için `flex-col` + `justify-between` yapısı kullanılacak. Her bölüm esnek spacing ile dağıtılacak. `overflow-y-auto` kaldırılacak. CTA butonu fixed pozisyondan çıkarılıp doğal flow'a dahil edilecek.

### Değişiklikler (`src/pages/Premium.tsx`)

**1. Ana layout — scroll'u kaldır, flex dağılımı yap**
- `<main>` → `overflow-y-auto` kaldır, `flex-1 flex flex-col justify-between` yap
- `paddingBottom` hesaplamasını sadece BottomNav clearance'a düşür
- İç container `space-y-6` → `space-y-0`, her section'a kontrollü `gap` ver

**2. Fixed CTA'yı flow'a dahil et**
- Mevcut `fixed left-0 right-0 z-40` CTA bloğunu kaldır
- CTA butonunu ve altındaki trust/legal text'i `<main>` içinde `mt-auto` ile en alta yerleştir
- Bu sayede scroll gerekmez, CTA her zaman alt kısımda görünür

**3. Section spacing'leri sıkılaştır**
- Hero: padding azalt (`py-3` → `py-1`), icon `w-9 h-9`, title `text-lg`
- Period toggle: margin azalt
- Plan cards: `gap-2` koru, card iç padding azalt (`pb-4 pt-5` → `pb-3 pt-4`)
- Feature pills: 2x2 grid yerine tek satır `flex-nowrap overflow-x-auto`
- Trust items: sadece 2 satır, spacing azalt

**4. Compact card iç düzeni**
- Plan card tagline + radio arasındaki `mt-4` → `mt-2`
- Icon container `w-8 h-8` → `w-7 h-7`
- Yearly equivalent text margin azalt

**5. Feature pills → inline compact**
- `flex-wrap` → `flex-nowrap gap-1.5`, pill padding `px-3 py-1.5`, font `text-[10px]`
- Horizontal scroll ile tüm ekranlarda tek satırda kalır

### Sonuç
- Tüm içerik 320px-414px yükseklikte (BottomNav hariç) tek ekrana sığar
- Scroll yok
- CTA butonu her zaman görünür (fixed değil, flow'da)
- Native app hissi: Spotify subscription screen benzeri

### Dosyalar
| Dosya | Değişiklik |
|---|---|
| `src/pages/Premium.tsx` | Layout restructure, fixed CTA → flow, spacing compact |

