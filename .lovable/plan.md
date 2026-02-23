

# Native Google OAuth - redirect_uri Hatasi Cozumu

## Sorun

Lovable Cloud OAuth sistemi, yalnizca projenin kendi preview domain'ini (`id-preview--...lovable.app`) redirect_uri olarak kabul ediyor. Kodda `https://golmetrik.app/callback` kullaniliyor, bu yuzden "redirect_uri is not allowed" hatasi aliyor.

## Zorluk

Harici tarayicida (Chrome) OAuth tamamlandiktan sonra token'larin native uygulamaya geri donmesi gerekiyor. Bunun icin iki asamali bir yaklasim gerekli:

1. OAuth sonrasi preview domain'e yonlendir (izin verilen URI)
2. Preview domain'deki sayfa, token'lari native uygulamaya aktarsin

## Cozum

### Dosya 1: `src/contexts/AuthContext.tsx`

redirect_uri'yi preview domain olarak degistir:

```text
// Eski:
redirect_uri: 'https://golmetrik.app/callback'

// Yeni:
redirect_uri: `${LOVABLE_CLOUD_URL}/callback?platform=native`
```

`?platform=native` parametresi, callback sayfasinin native uygulama icin calistigini belirtir.

### Dosya 2: `src/pages/AuthCallback.tsx`

Callback sayfasina native platform yonlendirmesi ekle:

- `platform=native` query parametresi var mi kontrol et
- Varsa: Token'lari URL'ye ekleyerek `golmetrik://callback?access_token=X&refresh_token=Y` adresine yonlendir (custom URL scheme)
- Yoksa: Mevcut davranis (session olustur, ana sayfaya git)

Bu sayfa Lovable preview domain'inde deploy edildiginde calisacak, yani harici tarayici bu sayfayi yukleyip native uygulamaya yonlendirecek.

### Kullanici Tarafinda Yapilacak (Android Studio)

Native uygulamanin `golmetrik://` custom URL scheme'ini dinlemesi gerekiyor. `android/app/src/main/AndroidManifest.xml` dosyasina su intent-filter eklenmelidir:

```text
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="golmetrik" android:host="callback" />
</intent-filter>
```

### Dosya 3: `src/App.tsx` (DeepLinkHandler)

DeepLinkHandler'a `golmetrik://` scheme'ini de yakalama destegi ekle. Mevcut host kontrolune `golmetrik` scheme'ini ekle.

## Akis

```text
1. Kullanici "Google ile Giris" tiklar
2. Browser.open() ile harici tarayici acilir:
   -> LOVABLE_CLOUD_URL/~oauth/initiate?provider=google&redirect_uri=LOVABLE_CLOUD_URL/callback?platform=native
3. Google giris -> Lovable Cloud -> preview-domain/callback?platform=native#access_token=...
4. AuthCallback sayfasi (preview domain'de) calisir
5. platform=native algilanir -> window.location.href = golmetrik://callback?access_token=X&refresh_token=Y
6. Android intent-filter tetiklenir -> appUrlOpen event
7. DeepLinkHandler token'lari alir -> supabase.auth.setSession()
8. Browser kapanir, ana sayfaya yonlendirilir
```

## Degisecek Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | redirect_uri'yi preview domain + platform=native olarak degistir |
| `src/pages/AuthCallback.tsx` | Native platform algilama ve custom scheme yonlendirmesi ekle |
| `src/App.tsx` | DeepLinkHandler'da golmetrik:// scheme destegi ekle |

## Kullanici Aksiyonu

Android Studio'da `AndroidManifest.xml`'e intent-filter eklenmesi gerekecek. Bu adim icin talimatlar verilecek.

