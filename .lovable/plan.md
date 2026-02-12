

# Capacitor 8 Uyumluluk Sorunu - Cozum Plani

## Sorun
`@codetrix-studio/capacitor-google-auth` eklentisi sadece Capacitor 6 ile uyumlu. Projeniz Capacitor 8 kullaniyor. Bu yuzden `npm install` basarisiz oluyor.

## Cozum
Eski eklentiyi kaldirip, Capacitor 8 ile uyumlu olan `@capgo/capacitor-social-login` eklentisine gecis yapacagiz. Bu eklenti, eski eklentinin resmi alternatifi ve ayni islevi goruyor.

## Yapilacaklar

### 1. Paket degisikligi
- `@codetrix-studio/capacitor-google-auth` kaldirilacak
- `@capgo/capacitor-social-login` (v8) eklenecek

### 2. AuthContext.tsx guncellenmesi
Import ve kullanim degisiklikleri:

- `GoogleAuth.initialize()` yerine `SocialLogin.initialize()` kullanilacak
- `GoogleAuth.signIn()` yerine `SocialLogin.login({ provider: 'google' })` kullanilacak
- `GoogleAuth.signOut()` yerine `SocialLogin.logout({ provider: 'google' })` kullanilacak
- idToken alma yolu yeni API'ye uyarlanacak

### 3. capacitor.config.ts guncellenmesi
`GoogleAuth` plugin ayari `SocialLogin` formatina donusturulecek.

## Yerel Kurulum Adimlari (degisiklikler uygulandiktan sonra)

Terminalde sirasiyla su komutlari calistirmaniz gerekecek:

```text
git pull
npm install
npm run build
npx cap sync
npx cap run android
```

## Teknik Detaylar

Degisecek dosyalar:
- `package.json` - eski paket cikarilip yeni paket eklenecek
- `src/contexts/AuthContext.tsx` - Google Auth API cagrilari guncellenecek
- `capacitor.config.ts` - Plugin konfigurasyonu guncellenecek

