## Sorun

Uygulama açıldığında bildirim izni dialog'u görünmüyor. Üç ayrı sebep birleşiyor:

1. İzin isteği `useLocalNotifications` içinde **`if (!user) return`** ile auth'a kilitli — `/auth` ekranındayken hiç çağrılmıyor.
2. `AndroidManifest.xml` içinde Android 13+ için zorunlu olan `POST_NOTIFICATIONS` runtime izni deklare edilmemişse, `LocalNotifications.requestPermissions()` sessizce `denied` döner ve sistem dialog'u açılmaz.
3. 3 saniyelik `setTimeout` + React StrictMode birlikte ilk mount'ta cleanup tetikleyebilir; ayrıca kullanıcı bir kez "Reddet" dediyse Android bir daha otomatik sormaz.

## Çözüm Planı

### 1. `useLocalNotifications` hook'unu auth'tan ayır
- İzin sorma + kanal oluşturma kısmını kullanıcı login'den BAĞIMSIZ hale getir; sadece **scheduling** (streak/match notifications) `user` ve `streak`'e bağlı kalsın.
- 3000ms timeout'u 800ms'ye düşür ve cleanup'ı sadece scheduling timer'ı için kullan, izin isteği için kullanma.
- İlk mount'ta `LocalNotifications.checkPermissions()` çağır:
  - `granted` → kanal oluştur, schedule'a geç
  - `prompt` → `requestPermissions()` çağır, sonuca göre devam et
  - `denied` → sessiz geç (Profil > Bildirimler ekranındaki "Ayarları Aç" CTA zaten var)
- StrictMode'a karşı `useRef` flag ile çift tetiklemeyi engelle.

### 2. AndroidManifest'e POST_NOTIFICATIONS izni ekle
Kullanıcının lokal Android projesinde aşağıdaki satırın `<manifest>` altında olması gerekiyor:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```
Bunu plan dosyasına net bir kullanıcı talimatı olarak ekleyeceğim. (Lovable sandbox'ta `android/` klasörü olmadığından kod tarafında düzenlenemiyor — Android Studio'da yapılacak.)

### 3. İlk açılışta görsel onboarding (opsiyonel ama önerilir)
İlk auth başarısından sonra, ana ekranın üstünde **bir kez** gösterilen küçük bir banner ekle: "Maç hatırlatmaları için bildirimleri aç" — tıklayınca `requestPermissions()` doğrudan kullanıcı etkileşimi içinde tetiklenir. Bu, daha önce reddedilmiş kullanıcılar için de yeni bir fırsat sağlar (sistem dialog'u tekrar açılmasa bile, denied banner ile ayarlara yönlendirilir).
- Banner state'i `Preferences` key `'notif_prompt_shown_v1'` ile saklanır, bir kez kapatınca tekrar gösterilmez.
- Konum: `src/pages/Index.tsx` üstüne küçük dismiss'lı kart.

### 4. Ek savunma: dev/preview davranışı
Web preview'da (`Capacitor.isNativePlatform() === false`) hiçbir prompt yok — bu zaten doğru. Profil > Bildirimler kartında "Bildirimler sadece mobil uygulamada çalışır" mesajı görünüyor; değiştirme.

## Etkilenecek dosyalar (kod tarafı)
- `src/hooks/useLocalNotifications.ts` — auth'tan ayır, checkPermissions önce, StrictMode guard
- `src/pages/Index.tsx` — tek-seferlik bildirim onboarding banner'ı
- `src/i18n/locales/{tr,en,de,es,ar}/profile.json` — yeni banner stringleri (`notifications.onboardingBanner.*`)

## Kullanıcı tarafı (Android Studio'da yapılacaklar)
1. `git pull`
2. `bun install`
3. **`android/app/src/main/AndroidManifest.xml`** dosyasını aç ve `<manifest>` etiketinin hemen altına şunu ekle (yoksa):
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```
4. `npx cap sync android`
5. Eğer önceden "İzin Verme" demişsen: telefonda **Ayarlar → Uygulamalar → GolMetrik → Bildirimler → Aç** veya uygulamayı tamamen kaldırıp tekrar yükle (Android prompt'u sıfırlamak için gerekli)
6. Android Studio'da `versionCode` artır, signed APK build et

## Doğrulama
- İlk açılışta (taze install, daha önce hiç izin istenmemiş): app açılır → ~1 sn sonra Android sistem dialog'u "Bildirim göndermesine izin verilsin mi?" çıkar
- Kabul → kanal oluşur, scheduling çalışır, çökme yok
- Reddet → çökme yok, ana ekranda "bildirimleri aç" banner'ı bir kez gösterilir
- Profil > Bildirimler kartı doğru durumu yansıtır (granted/prompt/denied)
