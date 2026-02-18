

# Native Android'de Google Sign-In: Tarayici Tabanli Yonteme Gecis

## Sorun
Native Android'de `@capgo/capacitor-social-login` eklentisi `webClientId` olarak placeholder (`YOUR_WEB_CLIENT_ID`) kullaniyor. Bu yuzden `[16] error communicating with server` hatasi aliniyor.

## Cozum
Native platformda da Lovable Cloud'un yonettigi OAuth akisini kullanmak. `@capacitor/browser` eklentisi ile uygulama ici tarayici acilacak ve Google girisi yapilacak. Ekstra yapilandirma gerektirmez.

## Yapilacak Degisiklikler

### Dosya: `src/contexts/AuthContext.tsx`

1. `nativeGoogleSignIn` fonksiyonu kaldirilacak
2. `signInWithGoogle` fonksiyonunda native platform kontrolu kaldirilacak
3. Hem web hem native icin ayni yol kullanilacak: `lovable.auth.signInWithOAuth("google")`
4. `SocialLogin.initialize()` cagrisi `useEffect`'ten kaldirilacak
5. `signOut`'taki native Google logout kodu kaldirilacak

Yeni `signInWithGoogle`:
```text
const signInWithGoogle = async () => {
  const redirectUri = window.location.origin;
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: redirectUri,
  });
  return { error: error as Error | null };
};
```

Yeni `signOut` (sadeleştirilmiş):
```text
const signOut = async () => {
  setUser(null);
  setSession(null);
  await supabase.auth.signOut();
};
```

### Dosya: `capacitor.config.ts`

`SocialLogin` plugin yapilandirmasi kaldirilacak (artik kullanilmiyor).

## Ozet

- 2 dosya degisecek
- Native'de tarayici tabanli Google OAuth kullanilacak
- `@capgo/capacitor-social-login` bagimliligi kodda kullanilmayacak (package.json'dan kaldirilabilir ama opsiyonel)
- Hicbir ek yapilandirma gerektirmez, Lovable Cloud otomatik yonetir

