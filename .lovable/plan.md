

# Logo Entegrasyonu: Favicon, App Icon ve Splash Screen

## Mevcut Durum

- **Logo Dosyası**: `src/assets/logo.png` - Header'da kullanılıyor
- **Favicon**: `public/favicon.ico` - Eski/varsayılan favicon
- **Capacitor**: Splash screen yapılandırması mevcut ama logo tanımlı değil

---

## Yapılacak Değişiklikler

### 1. Logo Dosyasını Public Klasörüne Kopyala

Logo dosyasını farklı boyutlarda public klasörüne ekleyeceğiz:

```text
public/
├── logo.png          (Orijinal logo - 512x512 önerilen)
├── logo-192.png      (PWA icon - 192x192)
├── logo-512.png      (PWA icon - 512x512)
├── favicon.png       (Browser favicon - 32x32 veya 64x64)
└── apple-touch-icon.png (iOS home screen - 180x180)
```

**Not**: Mevcut `src/assets/logo.png` dosyasını public klasörüne kopyalayacağız.

### 2. index.html Güncellemesi

Favicon ve Apple touch icon referanslarını güncelleyeceğiz:

```html
<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json" />
```

### 3. PWA Manifest Dosyası Oluştur

`public/manifest.json` dosyası oluşturarak PWA desteği ekleyeceğiz:

```json
{
  "name": "GolMetrik",
  "short_name": "GolMetrik",
  "description": "AI Destekli Futbol Tahmin Platformu",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/logo-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/logo-512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 4. Capacitor Splash Screen Yapılandırması

Capacitor config'de splash screen için logo referansı ekleyeceğiz:

```typescript
plugins: {
  SplashScreen: {
    launchAutoHide: false,
    backgroundColor: '#0f172a',
    androidScaleType: 'CENTER_CROP',
    showSpinner: false, // Logo varken spinner gereksiz
    launchShowDuration: 2000,
    // Android için: android/app/src/main/res/drawable/splash.png
    // iOS için: ios/App/App/Assets.xcassets/Splash.imageset/
  },
}
```

**Önemli**: Capacitor native splash screen için logo dosyalarının manuel olarak native proje klasörlerine eklenmesi gerekiyor:

- **Android**: `android/app/src/main/res/drawable/splash.png`
- **iOS**: `ios/App/App/Assets.xcassets/Splash.imageset/`

### 5. Open Graph Image Güncelleme

Sosyal medya paylaşımları için OG image'ı da güncelleyeceğiz:

```html
<meta property="og:image" content="/logo-512.png" />
<meta name="twitter:image" content="/logo-512.png" />
```

---

## Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|-------|-------|
| `public/logo.png` | Yeni - Ana logo kopyası |
| `public/logo-192.png` | Yeni - PWA icon (192x192) |
| `public/logo-512.png` | Yeni - PWA icon (512x512) |
| `public/favicon.png` | Yeni - Browser favicon |
| `public/apple-touch-icon.png` | Yeni - iOS icon |
| `public/manifest.json` | Yeni - PWA manifest |
| `index.html` | Güncelle - Icon referansları |
| `capacitor.config.ts` | Güncelle - Spinner kaldır |

---

## Capacitor Native App İçin Ek Adımlar

Native uygulama için logo dosyalarını doğru konumlara yerleştirmek gerekiyor. Bu adımları projeyi export ettikten sonra yerel ortamda yapmanız gerekecek:

### Android App Icon
```bash
# Logo dosyalarını aşağıdaki klasörlere kopyalayın:
android/app/src/main/res/mipmap-mdpi/ic_launcher.png      (48x48)
android/app/src/main/res/mipmap-hdpi/ic_launcher.png      (72x72)
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png     (96x96)
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png    (144x144)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png   (192x192)
```

### Android Splash Screen
```bash
android/app/src/main/res/drawable/splash.png
android/app/src/main/res/drawable-land/splash.png
```

### iOS App Icon
```bash
ios/App/App/Assets.xcassets/AppIcon.appiconset/
# Farklı boyutlarda icon dosyaları gerekli
```

---

## Önemli Notlar

1. **Logo Boyutu**: En iyi sonuç için orijinal logo en az 512x512 piksel olmalı
2. **Şeffaf Arka Plan**: PNG formatında şeffaf arka plan önerilir
3. **Maskable Icon**: PWA için maskable icon desteği ekleniyor
4. **Native Sync**: `npx cap sync` komutu ile native projeler güncellenecek

