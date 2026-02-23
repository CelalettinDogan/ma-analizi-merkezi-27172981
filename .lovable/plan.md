

# Native Google OAuth 404 Hatasi - Kok Neden ve Cozum

## Sorun

Lovable'in `cloud-auth-js` kutuphanesi, iframe disindayken `window.location.href = "/~oauth/initiate?..."` yaparak sayfayi yonlendiriyor. Web onizlemede bu calisiyor cunku `/~oauth/initiate` Lovable sunucusu tarafindan karsilaniyor. Ancak native Capacitor'da WebView'in hostname'i `golmetrik.app` oldugu icin bu URL `https://golmetrik.app/~oauth/initiate` oluyor -- bu rota React Router'da yok, sonuc: 404.

## Cozum

Native platformda `lovable.auth.signInWithOAuth` kullanmak yerine, OAuth URL'sini manuel olarak olusturup `@capacitor/browser` ile harici tarayicida acmak gerekiyor.

```text
OAuth akisi (native):
1. Kullanici "Google ile Giris" tiklar
2. OAuth URL olusturulur: https://id-preview--a043c351-80f7-4404-bfb0-4355af0b4d37.lovable.app/~oauth/initiate?provider=google&redirect_uri=https://golmetrik.app/callback
3. Browser.open() ile harici tarayici acilir
4. Google consent -> Lovable Cloud -> https://golmetrik.app/callback#access_token=...
5. Deep link handler veya /callback route'u token'lari yakalar
6. supabase.auth.setSession() ile oturum baslatilir
7. Harici tarayici kapatilir, ana sayfaya yonlendirilir
```

### Dosya: `src/contexts/AuthContext.tsx`

Native dalinda su degisiklikler yapilacak:

1. `@capacitor/browser` import edilecek (Browser.open icin)
2. `lovable.auth.signInWithOAuth` yerine manuel URL olusturulacak
3. Lovable Cloud'un OAuth broker endpoint'i (`/~oauth/initiate`) tam URL ile cagrilacak
4. `Browser.open()` ile harici tarayicide acilacak

```text
// Native dal (yeni):
const state = crypto.getRandomValues(new Uint8Array(16))
  .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

const params = new URLSearchParams({
  provider: 'google',
  redirect_uri: 'https://golmetrik.app/callback',
  state,
});

const oauthUrl = `https://id-preview--a043c351-80f7-4404-bfb0-4355af0b4d37.lovable.app/~oauth/initiate?${params}`;

await Browser.open({ url: oauthUrl });
return { error: null };
```

Deep link handler (`DeepLinkHandler` in App.tsx) ve `/callback` route'u (`AuthCallback.tsx`) zaten token'lari isliyor -- bu kisimda degisiklik gerekmez.

## Degisecek Dosya

| Dosya | Degisiklik |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | Native dalinda lovable.auth yerine manuel OAuth URL + Browser.open kullan |

