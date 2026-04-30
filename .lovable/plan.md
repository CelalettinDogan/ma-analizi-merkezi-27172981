
## Bildirim İzin Durumu Bilgilendirmesi

`NotificationSettings` bileşenine, bildirim izin durumunu (granted / prompt / denied) gerçek zamanlı kontrol edip kullanıcıya uygun banner gösteren bir sistem eklenecek.

### Yapılacaklar

**1. NotificationSettings.tsx Güncellemesi**

- Component mount'ta `LocalNotifications.checkPermissions()` ile izin durumu sorgulanacak
- 3 durum için farklı banner gösterilecek:
  - **granted** (izin var): Yeşil/emerald mini banner -- "Bildirimler aktif"
  - **prompt** (henüz sorulmadı): Amber bilgilendirme banner -- "Bildirimleri etkinleştir" butonu ile izin isteme
  - **denied** (engellendi): Kırmızı/destructive banner -- "Bildirimler engellendi. Ayarlardan etkinleştirin." + "Ayarları Aç" butonu
- "Ayarları Aç" butonu Android sistem bildirim ayarlarını açacak (`@capacitor/app-launcher` veya `NativeSettings` yerine Android intent URL kullanılacak -- mevcut Capacitor API ile `App.openUrl` veya `Browser.open` ile `app-settings` açılacak)
- İzin `denied` ise toggle switch'ler disabled olacak
- İzin istendikten sonra durum yeniden kontrol edilecek

**2. Teknik Detaylar**

- `LocalNotifications.checkPermissions()` -> `{ display: 'granted' | 'prompt' | 'denied' }`
- `LocalNotifications.requestPermissions()` ile izin isteme
- Android ayarlarını açmak için `@capacitor/core` NativeSettings plugin veya intent URL
- Mevcut tasarım diline uygun: glassmorphism kartlar, emerald/amber/red renk kodları, 8px grid
