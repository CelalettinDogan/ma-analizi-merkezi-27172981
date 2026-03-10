

## Plan: Android Font Scaling Tamamen Sabitleme (Counter-Scaling)

### Problem
Mevcut CSS `font-size: 16px !important` ve `textZoom: 100` korumaları bazı Android cihazlarda (Samsung One UI, Xiaomi MIUI) yetersiz kalıyor. WebView, sistem erişilebilirlik ayarlarından font büyütüldüğünde render edilen tüm metinlere çarpan uyguluyor ve CSS kurallarını bypass ediyor.

### Değişiklikler

**1. `src/main.tsx` — Runtime counter-scaling fonksiyonu**

Mevcut tek satırlık `document.documentElement.style.fontSize = '16px'` yerine akıllı ölçekleme algılama:

```typescript
function lockRootFontSize() {
  const test = document.createElement('div');
  test.style.cssText = 'font-size:16px;position:absolute;visibility:hidden;pointer-events:none;left:-9999px';
  document.body.appendChild(test);
  const actual = parseFloat(getComputedStyle(test).fontSize);
  document.body.removeChild(test);

  if (actual && actual !== 16) {
    document.documentElement.style.fontSize = ((16 / actual) * 16) + 'px';
  } else {
    document.documentElement.style.fontSize = '16px';
  }
}

// Run on load, resize, visibility change
document.addEventListener('DOMContentLoaded', lockRootFontSize);
window.addEventListener('resize', lockRootFontSize);
document.addEventListener('visibilitychange', lockRootFontSize);
// Also run immediately when body is available
if (document.body) lockRootFontSize();
```

Mantik: Sistem 16px'i 20px olarak render ediyorsa, root'u 12.8px'e ayarlar. `1rem = 12.8 × 1.25 zoom = 16px` sonucu verir.

**2. `src/index.css` — Global text-size-adjust koruması**

Mevcut seçici-bazlı korumayı (`button, nav, [role="tab"]...`) kaldırıp `*` selector ile evrensel koruma:

```css
/* Satır 117-125 arası değişir */
* {
  -webkit-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
}
```

`html` selector'daki mevcut `text-size-adjust` koruması da kalır.

**3. `index.html` — Viewport meta tag doğrulama**

Mevcut tag zaten doğru: `maximum-scale=1.0, user-scalable=no`. Değişiklik gerekmez.

### Etkilenen Dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/main.tsx` | Satır 9-10 → ~25 satırlık counter-scaling fonksiyonu + event listener'lar |
| `src/index.css` | Satır 117-125 → `*` selector ile evrensel `text-size-adjust` koruması |
| `index.html` | Değişiklik yok (zaten doğru) |

UI tasarımında hiçbir değişiklik yapılmaz. Sadece font scaling fix uygulanır.

