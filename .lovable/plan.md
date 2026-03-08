

# Android Native Hissiyat — WebView Davranışlarını Kaldırma

## Sorun
Capacitor WebView'da long press ile metin seçimi, kopyala/paylaş menüsü ve browser benzeri davranışlar çıkıyor. Bu profesyonel native app hissini bozuyor.

## Çözüm

### 1. Global CSS Değişiklikleri (`src/index.css`)

`@layer base` içindeki `*` ve `body` kurallarına şu özellikleri ekle:

```css
/* Tüm elementlerde metin seçimi ve WebView davranışlarını kapat */
* {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Sadece input/textarea/contenteditable'da seçimi aç */
input,
textarea,
[contenteditable="true"],
.selectable {
  -webkit-user-select: text;
  user-select: text;
  -webkit-touch-callout: default;
}
```

### 2. Overscroll ve Yatay Scroll Koruması

`html` ve `body`'ye `overscroll-behavior: none` ve `overflow-x: hidden` ekle (body'de zaten var).

### 3. Touch Active State İyileştirmesi

Tıklanabilir elemanlar için `active:scale-[0.97]` + `active:opacity-80` gibi native press feedback CSS ekle:

```css
button:active,
[role="button"]:active,
a:active {
  opacity: 0.85;
  transition: opacity 0.1s ease;
}
```

## Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/index.css` | Global user-select:none, touch-callout:none, tap-highlight:transparent, overscroll-behavior:none, input/textarea exception, active state feedback |

Tek dosya değişikliği — tüm bileşenler global CSS'ten etkilenir. Input ve textarea alanları korunur.

