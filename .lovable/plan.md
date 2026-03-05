

# Android Sistem Font Ölçeklendirme Koruması

## Sorunun Kaynağı

Android'de kullanıcılar **Ayarlar → Ekran → Yazı tipi boyutu/kalınlığı** ile sistem genelinde %130-200 arası büyütme yapabilir. WebView (Capacitor) bu ayarı varsayılan olarak sayfaya yansıtır ve `rem`/`em` tabanlı tüm boyutlar orantılı büyür. Bu da:
- Buton metinlerinin taşmasına
- Kartların kırılmasına
- Navigasyonun bozulmasına neden olur.

Mevcut `text-size-adjust: 100%` sadece tarayıcının *otomatik* text inflation'ını engeller, Android sistem font scaling'ini **engellemez**.

## Çözüm Stratejisi

Profesyonel uygulamalar (WhatsApp, Instagram vb.) WebView'daki font scaling'i tamamen devre dışı bırakır. Bunun için iki katmanlı müdahale gerekir:

### 1. Capacitor WebView Ayarı (`capacitor.config.ts`)
Android WebView'da `textZoom` değerini `100`'e sabitleyerek sistem font ölçeklendirmesini tamamen devre dışı bırakmak. Capacitor'ın `android.webViewSettings` config'ine eklenecek:

```ts
android: {
  // ...mevcut ayarlar
  webViewSettings: {
    textZoom: 100  // Sistem font scaling'ini devre dışı bırak
  }
}
```

Bu **tek başına** sorunu tamamen çözer. Ancak ek güvenlik katmanı olarak:

### 2. CSS Güvenlik Katmanı (`src/index.css`)
Eski WebView sürümlerinde fallback olarak tüm temel UI elemanlarına `-webkit-text-size-adjust: none` ve sabit font boyutları eklemek:

```css
html {
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
}
```

> **Not**: `100%` → `none` değişikliği, tarayıcının *hiçbir koşulda* font boyutunu değiştirmemesini garanti eder.

### 3. Kritik UI Elemanları için `!important` Koruması
Butonlar, navigasyon ve header gibi kırılgan alanlara minimum/maksimum boyut sınırları:

```css
.bottom-nav-text, button, [role="tab"] {
  font-size: inherit !important;
  -webkit-text-size-adjust: none !important;
}
```

## Değişecek Dosyalar
1. **`capacitor.config.ts`** — `android.webViewSettings.textZoom: 100` ekle
2. **`src/index.css`** — `text-size-adjust: 100%` → `none`, kritik element koruması

## Etki
- Sistem font scaling tamamen devre dışı kalır (native app davranışı)
- Mevcut tasarım, responsive yapı ve animasyonlar korunur
- Kullanıcı deneyimi tüm Android cihazlarda tutarlı olur

