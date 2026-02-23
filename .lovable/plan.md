
# Capacitor Splash Ekrani Gorseli Ayarlama

## Yapilacaklar

### 1. Gorseli projeye kopyala
Yuklenen `splash.png` dosyasini `public/splash.png` olarak kopyala. Bu dosya build sirasinda `dist/` klasorune dahil edilecek.

### 2. Capacitor config guncelle
`capacitor.config.ts` dosyasindaki SplashScreen yapilandirmasini guncelle:
- `launchAutoHide: false` kalacak (uygulama hazir olunca gizlenecek)
- `androidScaleType: 'CENTER'` olarak degistir (gorsel ortalansin, kirpilmasin)
- `backgroundColor: '#0f172a'` kalacak (koyu arka plan, seffaf gorsel uzerinde guzel gorunur)
- `launchShowDuration: 2500` olarak artir (logo gorunurlugunu uzat)

### 3. Kullanici icin yerel adimlar (Android tarafinda)
Capacitor splash screen gorseli Android tarafinda `android/app/src/main/res/drawable/` klasorune yerlestirilmelidir. Kullaniciya sunlar anlatilacak:

1. `public/splash.png` dosyasini Android projede `android/app/src/main/res/drawable/splash.png` olarak kopyala
2. Farkli ekran boyutlari icin `drawable-mdpi`, `drawable-hdpi`, `drawable-xhdpi`, `drawable-xxhdpi`, `drawable-xxxhdpi` klasorlerine farkli boyutlarda yerlestirebilirsin
3. `npx cap sync` calistir

## Dosya Degisiklikleri

| Dosya | Degisiklik |
|-------|-----------|
| `public/splash.png` | Yuklenen gorseli kopyala |
| `capacitor.config.ts` | SplashScreen ayarlarini guncelle (scaleType, duration) |
