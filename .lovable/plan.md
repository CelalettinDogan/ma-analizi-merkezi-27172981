

# Native Android'de Google Sign-In 404 Hatasi Cozumu

## Sorunun Kok Nedeni

`@lovable.dev/cloud-auth-js` kutuphanesi, Google girisi icin `/~oauth/initiate` adresine yonlendirme yapiyor. Bu adres Lovable'in web altyapisinda otomatik olarak yakalanip isleniyor. Ancak native Android'de (Capacitor), uygulama `https://golmetrik.app` hostname'i ile calisiyor ve `/~oauth/initiate` adresi icin bir sunucu yok. React Router bu adresi yakalayamayinca 404 gosteriyor.

## Cozum

Native platformda `lovable.auth` yerine dogrudan Supabase OAuth kullanilacak. `@capacitor/browser` ile uygulama ici tarayici acilacak, kullanici Google'da giris yapacak, sonra deep link ile uygulamaya donecek.

## Degisecek Dosyalar

### 1. `src/contexts/AuthContext.tsx`

`signInWithGoogle` fonksiyonu platform kontrolu yapacak:

- **Web (iframe/tarayici)**: Mevcut `lovable.auth.signInWithOAuth("google")` kullanilmaya devam edecek
- **Native (Capacitor)**: `supabase.auth.signInWithOAuth` ile `skipBrowserRedirect: true` kullanilacak, donen URL `@capacitor/browser` ile acilacak

```text
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const signInWithGoogle = async () => {
  if (Capacitor.isNativePlatform()) {
    // Native: Supabase OAuth + in-app browser
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://golmetrik.app/callback',
        skipBrowserRedirect: true,
      },
    });
    if (error) return { error: error as Error };
    if (data?.url) {
      await Browser.open({ url: data.url });
    }
    return { error: null };
  } else {
    // Web: Lovable Cloud managed OAuth
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    return { error: error as Error | null };
  }
};
```

### 2. `src/App.tsx` - DeepLinkHandler Guncelleme

Mevcut deep link handler zaten `/callback` yolunu dinliyor. Ek olarak `@capacitor/browser` dinleyicisi eklenecek ki OAuth sonrasi tarayici otomatik kapansin ve oturum kurulsun:

```text
// DeepLinkHandler icinde Browser listener ekleme
import { Browser } from '@capacitor/browser';

// appUrlOpen event'inde callback kontrolu + Browser.close()
// URL hash'inden veya search params'tan access_token/refresh_token alinip
// supabase.auth.setSession ile oturum kurulacak
```

### 3. `capacitor.config.ts` - Deep Link Yapilandirmasi (Degisiklik Yok)

Mevcut yapilandirma zaten `hostname: 'golmetrik.app'` ve `androidScheme: 'https'` kullaniyor. Deep link yakalama icin Android tarafinda `AndroidManifest.xml`'de intent-filter gerekiyor ama bu dosya Capacitor tarafindan otomatik olusturuluyor.

## Akis Ozeti

```text
Kullanici "Google ile Giris Yap" tiklar
  -> Native mi? Evet
    -> supabase.auth.signInWithOAuth (skipBrowserRedirect: true)
    -> URL alinir, Browser.open() ile acilir
    -> Google giris sayfasi gosterilir
    -> Basarili giris sonrasi golmetrik.app/callback'e yonlendirilir
    -> Capacitor appUrlOpen event'i tetiklenir
    -> Token'lar URL'den parse edilir
    -> supabase.auth.setSession ile oturum kurulur
    -> Browser.close() ile tarayici kapatilir
    -> Ana sayfaya yonlendirilir
```

## Ozet

- 2 dosya degisecek: `AuthContext.tsx` ve `App.tsx`
- Web'de Lovable Cloud managed OAuth korunacak (degisiklik yok)
- Native'de Supabase direct OAuth + in-app browser kullanilacak
- Deep link callback ile token'lar yakalanip oturum kurulacak

