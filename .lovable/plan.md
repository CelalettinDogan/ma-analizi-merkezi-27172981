
# Google OAuth - Native Android Uyumu

## Tespit Edilen Sorun

Mevcut Google OAuth yapılandırması **sadece web'de çalışır**. Native Android uygulamasında kullanıcı Google ile giriş yaptığında:

1. Google hesap seçim sayfası açılır (tarayıcıda)
2. Kullanıcı hesabını seçer
3. ❌ **Sorun**: Tarayıcı web URL'ye yönlendirir, **uygulama açılmaz**

## Teknik Açıklama

```
Mevcut Akış (Hatalı)
=====================
Uygulama → Tarayıcı → Google → Tarayıcı (kullanıcı burada kalır ❌)

Doğru Akış
===========
Uygulama → Tarayıcı → Google → Deep Link → Uygulama ✅
```

## Çözüm: Deep Link + Custom URL Scheme

### 1. Capacitor Yapılandırması

`capacitor.config.ts` dosyasına server yapılandırması eklenecek:

```typescript
const config: CapacitorConfig = {
  appId: 'app.golmetrik.android',
  appName: 'GolMetrik',
  webDir: 'dist',
  server: {
    androidScheme: 'https', // veya custom scheme
    hostname: 'golmetrik.app',
  },
  // ...
};
```

### 2. Android Manifest Güncelleme

`android/app/src/main/AndroidManifest.xml` dosyasına intent-filter eklenecek:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="app.golmetrik.android" android:host="callback" />
</intent-filter>
```

### 3. AuthContext Güncelleme

Platform bazlı dinamik redirect_uri:

```typescript
import { Capacitor } from '@capacitor/core';

const signInWithGoogle = async () => {
  // Platform bazlı redirect URI
  const redirectUri = Capacitor.isNativePlatform()
    ? 'app.golmetrik.android://callback'
    : window.location.origin;

  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: redirectUri,
  });
  return { error: error as Error | null };
};
```

### 4. Deep Link Handler

Uygulama açıldığında callback URL'yi işleyecek handler:

```typescript
// App.tsx veya main.tsx
import { App as CapApp, URLOpenListenerEvent } from '@capacitor/app';

CapApp.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
  const url = new URL(event.url);
  if (url.pathname === '/callback') {
    // OAuth token'ları işle
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }
});
```

---

## Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `capacitor.config.ts` | Güncelle - server yapılandırması |
| `src/contexts/AuthContext.tsx` | Güncelle - platform bazlı redirect_uri |
| `src/App.tsx` | Güncelle - Deep Link handler ekle |
| `android/app/src/main/AndroidManifest.xml` | Güncelle - intent-filter (manuel) |

---

## Önemli Not: Manuel Adımlar

Android Manifest değişikliği **Lovable dışında** yapılmalı:

1. Projeyi GitHub'a export et
2. `android/` klasöründe manifest dosyasını düzenle
3. `npx cap sync` komutu çalıştır

---

## Alternatif: In-App Browser

Eğer Deep Link yapılandırması çok karmaşık gelirse, alternatif olarak **In-App Browser** (Capacitor Browser plugin) kullanılabilir. Bu yöntemde:

- OAuth akışı uygulama içindeki tarayıcıda açılır
- `browserFinished` event'i dinlenerek oturum kontrol edilir

Ancak bu yöntem daha az güvenilirdir ve bazı OAuth sağlayıcıları tarafından desteklenmeyebilir.

---

## Test Senaryoları

1. **Native Build**:
   - APK oluştur
   - Google ile giriş yap
   - Uygulama otomatik açılmalı ve giriş yapılmış olmalı

2. **Deep Link Test**:
   - `adb shell am start -a android.intent.action.VIEW -d "app.golmetrik.android://callback?token=test"`
   - Uygulama açılmalı
