

## Plan: Admin Paneli — Mobil Native Polish

### Sorun
Admin paneli masaüstünde profesyonel, ancak 390px mobil ekranda UserManagement tablosu yatay scroll gerektiriyor ve dialog'lar native hissinden uzak.

### İyileştirmeler

**1. UserManagement — Mobil Kart Görünümü**
**Dosya:** `src/components/admin/UserManagement.tsx`

- `useIsMobile()` hook'u ile ekran boyutu algıla
- Mobilde (< 768px): Tablo yerine kart listesi render et
  - Her kullanıcı bir `Card` olarak gösterilir: avatar, isim, email, plan badge, rol badge, usage stats, action menu
  - Daha okunabilir, dokunma dostu
- Masaüstünde: Mevcut tablo korunur

**2. Dialog → Drawer (Mobil)**
**Dosya:** `src/components/admin/UserManagement.tsx`

- Premium atama ve ban dialog'larını mobilde `Drawer` (bottom sheet) olarak render et
- `useIsMobile()` kontrolü ile koşullu render
- Masaüstünde mevcut `Dialog` korunur

### Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `src/components/admin/UserManagement.tsx` | Mobil kart görünümü + drawer dönüşümü |

Tek dosya. Fonksiyonalite değişmez. Sadece mobil UX iyileştirmesi.

