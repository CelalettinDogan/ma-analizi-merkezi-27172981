

## Problem

Mevcut korumalar (`textZoom: 100` ve `text-size-adjust: none`) bazı Android cihazlarda (özellikle Samsung, Xiaomi) yetersiz kalıyor. Bunun sebebi:

1. **Tüm font-size'lar `rem` biriminde** — Tailwind config'deki tüm özel font boyutları (`micro`, `xs`, `sm`, `base`, vb.) rem kullanıyor. `rem` birimi `html` elementinin font-size'ına bağlı ve bazı Android üreticileri bu root font-size'ı OS seviyesinde değiştiriyor.

2. **`text-size-adjust: none`** sadece tarayıcı seviyesindeki otomatik boyutlandırmayı engelliyor, OS seviyesindeki root font-size değişikliğini engellemiyor.

3. **`textZoom: 100`** WebView'ın kendi zoom'unu sabitliyor ama bazı cihazlarda OS'un root font-size override'ını engellemiyor.

## Çözüm: Root Font-Size'ı Sabitlemek

Root `html` elementinin font-size'ını JavaScript ile sabit `16px`'e kilitlemek. Bu sayede tüm `rem` hesaplamaları cihaz font ayarından bağımsız olacak.

### 1. `src/main.tsx` — Root font-size kilidi

Uygulama başlatılmadan önce `html` elementinin `font-size`'ını `16px` olarak sabitlemek:

```typescript
document.documentElement.style.fontSize = '16px';
```

Bu tek satır, tüm rem-tabanlı hesaplamaları cihazdan bağımsız hale getirir.

### 2. `src/index.css` — CSS ile çifte koruma

```css
html {
  font-size: 16px !important;
  -webkit-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
}
```

`none` yerine `100%` kullanmak daha güvenilir — `none` bazı tarayıcılarda desteklenmiyor. `!important` ile OS override'ları geçersiz kılınıyor.

### 3. Spacing'lerin korunması

`tailwind.config.ts`'deki spacing de `rem` kullandığından, root sabitlenince bunlar da otomatik olarak sabitlenmiş olacak. Ek değişiklik gerekmez.

### Özet

| Değişiklik | Dosya | Ne yapıyor |
|---|---|---|
| JS font-size kilidi | `src/main.tsx` | Runtime'da root font-size'ı 16px'e sabitler |
| CSS font-size kilidi | `src/index.css` | CSS seviyesinde çifte koruma sağlar |

Kod değişikliği sadece 2 dosyada, toplam ~3 satır. Tüm rem-tabanlı boyutlar (font, spacing, border-radius) cihaz font ayarından bağımsız çalışacak.

