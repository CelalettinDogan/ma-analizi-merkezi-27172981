
# Native Google Giris Hatasi Duzeltme

## Sorun

Native Android'de Google ile giris "Unsupported provider: missing OAuth secret" hatasi veriyor. Sebep: `AuthContext.tsx` icindeki native dal, `supabase.auth.signInWithOAuth` fonksiyonunu dogrudan cagiriyor. Ancak Google OAuth secret'i Supabase seviyesinde degil, Lovable Cloud tarafinda yonetiliyor. Bu yuzden Supabase "secret yok" diyor.

Web'de calisan kod `lovable.auth.signInWithOAuth` kullaniyor ve bu fonksiyon Lovable Cloud uzerinden OAuth URL'sini alip yonlendirme yapiyor.

## Cozum

Native platformda da `lovable.auth.signInWithOAuth` kullanilacak. Ancak native'de otomatik browser redirect yerine, donen OAuth URL'sini `@capacitor/browser` ile acmamiz gerekiyor.

### Dosya: `src/contexts/AuthContext.tsx`

`signInWithGoogle` fonksiyonundaki native dalini degistir:

```text
// ONCEKI (hatali):
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'https://golmetrik.app/callback', skipBrowserRedirect: true }
});
if (data?.url) await Browser.open({ url: data.url });

// SONRAKI (duzeltilmis):
// Lovable Cloud managed OAuth kullan
// redirect_uri olarak golmetrik.app/callback ver (deep link icin)
const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: "https://golmetrik.app/callback",
});
if (result.error) return { error: result.error as Error };
return { error: null };
```

Bu degisiklikle:
- Native'de de Lovable Cloud'un yonetilen Google OAuth kimlik bilgileri kullanilacak
- "missing OAuth secret" hatasi ortadan kalkacak
- Deep link callback mekanizmasi (`DeepLinkHandler` in App.tsx) ayni sekilde calisacak cunku redirect URI degismiyor

## Degisecek Dosya

| Dosya | Degisiklik |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | Native dalinda `supabase.auth.signInWithOAuth` yerine `lovable.auth.signInWithOAuth` kullan |
