

# Google Sign-In "scopes" Hatasi Cozumu

## Sorun
Native Android'de Google ile giris yaparken su hata aliniyor:
"You CANNOT use scopes without modifying the main activity. Please follow the docs!"

Bu hata `@capgo/capacitor-social-login` eklentisinden geliyor. `SocialLogin.login()` cagirisinda `scopes: ['profile', 'email']` parametresi geciliyor, ancak Android tarafinda `MainActivity.java` dosyasi bu scopes destegi icin yapilandirilmamis.

## Cozum
`scopes` parametresini kaldirmak. Google Sign-In zaten varsayilan olarak `email` ve `profile` bilgilerini idToken icerisinde dondurur, bu yuzden ayrica scope belirtmeye gerek yoktur.

## Yapilacak Degisiklik

### Dosya: `src/contexts/AuthContext.tsx`

`nativeGoogleSignIn` fonksiyonundaki `SocialLogin.login()` cagrisindan `options.scopes` parametresi kaldirilacak:

Onceki:
```typescript
const loginResult = await SocialLogin.login({
  provider: 'google',
  options: {
    scopes: ['profile', 'email'],
  },
});
```

Sonraki:
```typescript
const loginResult = await SocialLogin.login({
  provider: 'google',
  options: {},
});
```

Bu tek satirlik degisiklik sorunu cozecektir.

