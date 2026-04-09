

## Plan: Splash Screen Görseli Değiştirme

### Yapılacaklar

**1. Görsel Değiştirme**
- Yüklenen splash görseli (`splash-3.png`) → `public/splash.png` olarak kopyalanır (mevcut splash.png'nin üzerine yazılır)

**2. Capacitor Config Güncelleme**
**Dosya:** `capacitor.config.ts`
- `SplashScreen.backgroundColor`: `#0f172a` (koyu) → `#7ECFB3` (görseldeki gradient'in orta tonu) — splash görseli etrafındaki boşluk rengi görselle uyumlu olur
- `androidScaleType`: `CENTER` → `CENTER_CROP` — görselin tüm ekranı kaplamasını sağlar

**3. Kullanıcı Talimatı**
- Değişiklik sonrası yerel ortamda `npx cap sync android` çalıştırılmalı — splash görseli Android native katmanına kopyalanır

### Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `public/splash.png` | Yeni görsel ile değiştir |
| `capacitor.config.ts` | backgroundColor ve scaleType güncelle |

