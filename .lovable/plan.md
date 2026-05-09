## Amaç

Uygulamadaki Firebase tabanlı push notification altyapısını tamamen kaldır, yerine `@capacitor/local-notifications` ile cihaz üzerinden zamanlanan günlük maç ve seri (streak) hatırlatmalarını aktif et. Böylece izin verildikten sonra yaşanan çökme ortadan kalkar ve Firebase/`google-services.json` gereksinimi olmaz.

## Yapılacaklar

### 1. Push notification katmanını kaldır
- `src/hooks/usePushNotifications.ts` dosyasını sil.
- `src/App.tsx` içinden `usePushNotifications` import'u ve `usePushNotifications()` çağrısını kaldır.
- `package.json` içinden `@capacitor/push-notifications` bağımlılığını çıkar.
- `supabase/functions/send-push-notification/` edge function'ını sil (artık tetiklenmiyor).
- `push_tokens` tablosunu temizleyen bir migration aç (tablo varsa drop, RLS politikalarıyla birlikte).
- Admin panelinde push gönderim arayüzü varsa (`NotificationManagement.tsx`) ilgili push gönderme bölümünü kaldır veya "Yerel hatırlatmalar yalnızca cihazda" notuyla devre dışı bırak.

### 2. Local notifications'ı resmi giriş noktası yap
- `src/App.tsx` içinde `useLocalNotifications` hook'unu aktif et (mevcut `useStreakHeartbeat`'ın yanına ekle).
- `useLocalNotifications` zaten 3 sn gecikmeli izin istiyor; splash kapandıktan sonra çağrıldığı için çökme riski yok. Ek koruma olarak `try/catch` ve `Capacitor.isNativePlatform()` kontrollerini doğrula.
- Hook üç bildirimi zamanlıyor: günlük maç hatırlatması (18:00), streak hatırlatması (20:00, sadece aktif streak varsa), haftalık özet (Pazartesi 10:00). Bunlar yeterli.

### 3. Profil > Bildirim Ayarları'nı local'e bağla
- `src/components/profile/NotificationSettings.tsx` üzerindeki toggle'ları `getNotificationPrefs` / `setNotificationPrefs` ile senkronize et.
- Toggle değişiminde `scheduleNotifications()` tekrar çağırılarak zamanlama yenilensin.
- "Push bildirim" yazıları "Hatırlatmalar" olarak güncellensin (TR + diğer 4 locale).

### 4. Android manifest temizliği
- `AndroidManifest.xml` (varsa) `POST_NOTIFICATIONS` izni kalsın (local notifications de bunu kullanıyor), ancak FCM/`google-services` ile ilgili meta-data ve receiver tanımları kaldırılsın. `android/app/google-services.json` dosyası gerekirse silinsin.

### 5. Doğrulama
- `bun run build` başarılı olmalı.
- Kapsamlı manuel kontrol: `npx cap sync android` sonrası uygulama açıldığında izin diyaloğu 3 sn sonra çıkmalı, kabul/red sonrası çökme olmamalı, profil ekranında toggle kapatılınca planlı bildirim iptal olmalı.

## Teknik Notlar

- Local notifications cihaz lokalinde çalışır; sunucu push'a gerek yoktur, dolayısıyla Firebase ve `send-push-notification` edge function tamamen kaldırılır.
- Streak hatırlatması mesajı zaten `useLocalNotifications` içinde dinamik (mevcut streak gün sayısına göre). Ekstra mantık gerekmez.
- Quiet hours desteği için `src/lib/quietHours.ts` zaten var; ileride `scheduleNotifications` içine bu kontrol eklenebilir (bu plan kapsamı dışı).
- Capacitor versiyon notu: `@capacitor/local-notifications` zaten kuruluysa ek kurulum gerekmez; değilse `bun add @capacitor/local-notifications` ve `npx cap sync` kullanıcı tarafında çalıştırılmalı.
