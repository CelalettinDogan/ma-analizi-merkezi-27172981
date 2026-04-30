## Yerel Zamanlanmis Bildirimler (Firebase Gerektirmez)

`@capacitor/local-notifications` eklentisi ile cihaz uzerinde zamanlanmis bildirimler olusturulacak. Sunucu tarafina ihtiyac yok, tamamen cihazda calisir.

### 1. Eklenti Kurulumu

- `@capacitor/local-notifications` paketini yukle

### 2. `useLocalNotifications.ts` Hook Olustur

- Uygulama acildiginda bildirim izni iste
- Su bildirimleri zamanla:
  - **Gunluk mac hatirlatmasi** (her gun 18:00) -- "Bugunun maclarini analiz ettin mi?"
  - **Seri hatirlatmasi** (her gun 20:00) -- "Serini kirma! Bugun giris yap" (sadece streak > 0 ise)
  - **Haftalik ozet** (Pazartesi 10:00) -- "Gecen haftaki tahminlerin dogru cikti!"
- Kullanici giris yaptiginda bildirimleri yeniden zamanla (streak degerine gore mesaj guncelle)
- Bildirim tiklama deep-link destegi (ana sayfa, analiz vb.)

### 3. Bildirim Tercih Ayarlari

- Profil sayfasina bildirim acma/kapama toggle'lari ekle:
  - Mac Hatirlatmalari (acik/kapali)
  - Seri Hatirlatmalari (acik/kapali)
- Tercihler `@capacitor/preferences` ile cihazda saklanir

### 4. App.tsx Entegrasyonu

- Hook'u TabShell icinde cagir
- Kullanici giris yaptiginda otomatik zamanla

### Teknik Detay

- `@capacitor/local-notifications` Capacitor 8 uyumlu
- Bildirimler cihazda zamanlanir, uygulama kapali olsa da calisir
- Android notification channel olusturulur (`golmetrik_reminders`)
- Mevcut `usePushNotifications.ts` (FCM) korunur -- ileride FCM eklenirse birlikte calisir
- `npx cap sync` sonrasi cihazda test edilebilir