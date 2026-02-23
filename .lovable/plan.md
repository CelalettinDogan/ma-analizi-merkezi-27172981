

# Uygulama Logosunu Guncelleme

Yuklenen gorseli (tac takili futbol topu) uygulamanin tum logo noktalarinda kullanilacak sekilde ayarlayacagiz.

## Yapilacak Degisiklikler

### 1. Gorseli projeye kopyala
- `src/assets/logo.png` -- React bilesenlerinde kullanilmak uzere (header, onboarding vb.)
- `public/logo-192.png` -- PWA manifest 192x192 ikon
- `public/logo-512.png` -- PWA manifest 512x512 ikon
- `public/favicon.png` -- Tarayici favicon
- `public/apple-touch-icon.png` -- iOS ana ekran ikonu
- `public/logo.png` -- OG/Twitter meta gorsel

### 2. Capacitor Android Launcher Ikonu
Android launcher ikonlari icin kullaniciya yerel talimatlar verilecek:
- Gorseli Android Studio'da `Image Asset` araci ile ic_launcher olarak ayarla
- `android/app/src/main/res/mipmap-*` klasorlerine farkli boyutlarda yerlestir

### 3. Kod Degisikligi Gerekmiyor
- `src/assets/logo.png` zaten header ve diger bilesenlerden import ediliyor
- `public/` altindaki dosyalar manifest.json ve index.html'den referans aliniyor
- Dosya adlari ayni kaldigi icin kod degisikligi gerekmez

## Kullanici Icin Android Adimlari
Gorseller guncellendikten sonra:
1. `git pull` ile projeyi cek
2. Android Studio'da `Image Asset` araci ile `ic_launcher` olustur
3. `npx cap sync` calistir
4. Uygulamayi derle

