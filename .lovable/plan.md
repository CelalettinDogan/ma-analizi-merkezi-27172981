## Plan — Admin Mobile Native + Login Yönlendirme Düzeltmesi

### 1) Sorun: Login sonrası /admin açılıyor

**Sebep:** AuthGuard, /admin'e doğrudan erişim denendiğinde `/auth` sayfasına `state.from='/admin'` gönderiyor. Auth.tsx login sonrası bu `from`'a dönüyor. Ayrıca user-menu'den admin linkine tıklayıp logout olunca, sonraki login otomatik admin'e dönüyor.

**Çözüm:** Auth.tsx'te `from` değerini güvenli rotalarla sınırla — admin gibi yetki gerektiren rotalar dışlanır, login her zaman ana sayfa (`/`) açar. Ayrıca AuthGuard `from` göndermeyi sadece tab rotaları için yapsın.

```ts
// src/pages/Auth.tsx
const SAFE_RETURN = ['/', '/live', '/chat', '/standings', '/premium', '/profile'];
const from = (location.state as any)?.from;
const target = SAFE_RETURN.includes(from) ? from : '/';
navigate(target, { replace: true });
```

Sonuç: kullanıcı giriş yapınca her zaman ana sayfa açılır. Admin'e ulaşmak için profil → kullanıcı menüsü → "Admin Panel" linki kullanılır (zaten mevcut, UserMenu.tsx).

### 2) Admin Panel — Tam Native Mobile (Bottom Tabs)

Mevcut `AdminLayout.tsx` mobilde üst yatay sekme + hamburger drawer kullanıyor. Bunu app'in geri kalanı gibi alt sekmeli native yapıya dönüştürürüz.

#### Mobile (<768px)
- **Üst başlık (sticky, pt-safe):** geri butonu (Uygulamaya dön → `/`), aktif bölüm başlığı, "Live" rozeti.
- **İçerik:** `flex-1 overflow-y-auto`, `paddingBottom: calc(80px + env(safe-area-inset-bottom))` (mevcut bottom-nav clearance pattern).
- **Alt sekme barı (`AdminBottomNav`):** floating pill, `backdrop-blur-2xl`, BottomNav.tsx ile aynı stil dili. 7 sekme fazla → 5 ana sekme + "Daha" overflow:
  - Dashboard, Kullanıcılar, Gelir, AI, **Daha** (sheet açılır: Premium, Bildirim, Log)
- Her dokunuşta `Haptics.impact({ style: ImpactStyle.Light })`.
- `user-select: none`, `-webkit-tap-highlight-color: transparent` (zaten globalde).

#### Desktop (≥768px)
- Mevcut sidebar + topbar + Command Palette korunur (değişiklik yok).

#### Yeni / değişen dosyalar
- **Yeni:** `src/components/admin/AdminBottomNav.tsx` — 5 sekme + "Daha" overflow sheet, BottomNav.tsx pattern'i.
- **Değişen:** `src/components/admin/AdminLayout.tsx` — mobil dalı baştan yazılır:
  - Hamburger drawer + üst yatay sekme stripi kaldırılır.
  - Mobilde sidebar/SidebarProvider sarmalayıcı yalnız `md:` üstünde aktif (mobilde basit `<div>` shell).
  - Yeni mobil header (44px back, başlık, Live rozeti).
  - `<AdminBottomNav />` mount edilir (sadece mobilde).
- **Değişen:** `src/pages/Admin.tsx` — pt-safe ve native iskelete uyacak şekilde küçük spacing düzenlemeleri (yetki engellendi/loading ekranları).

#### Komut paleti
Mobilde gizli, desktop'ta kalır (mevcut davranış). ⌘K hotkey desktop için.

#### Tasarım tokenları
- Renkler: emerald primary, amber accent (mevcut).
- Radii: 12-16px kart, 24px bottom nav pill.
- Border: `border-border/60`, `bg-background/80 backdrop-blur`.
- Tüm spacing 8pt grid.

### 3) Memory güncelleme
`mem://features/admin-panel-mobile-native-ux` dosyasını yeni yapıya göre güncelle (alt sekmeli native admin, "Daha" overflow, login redirect güvenli rotalar).

### Kapsam dışı (faz 2'ye)
- User detail sheet, server-side advanced filters, bulk actions — onceden plana eklenmişti, ileride.
- Realtime KPI, feature flags.
