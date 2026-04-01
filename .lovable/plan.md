

## Son Kontrol & İyileştirmeler — Play Store Yayın Öncesi

Uygulama teknik olarak sağlam bir temele sahip: Capacitor 8, lazy loading, ErrorBoundary, RLS, Google Play Billing, deep link, accessibility aria-labels. Aşağıdakiler yayın öncesi son polish niteliğinde.

---

### 1. PRODUCTION CONSOLE TEMİZLİĞİ
**Sorun:** 42 dosyada ~748 console.log/warn/error çağrısı var. Play Store review'da "debug bilgisi sızıntısı" riski.

**Çözüm:** Vite build'de production console çıktılarını otomatik kaldıran config ekle.

**Dosya:** `vite.config.ts`
- `build.minify: 'terser'` ve `terserOptions.compress.drop_console: true` ekle
- Development'ta console korunur, production build'de otomatik temizlenir

---

### 2. PACKAGE.JSON TEMİZLİĞİ
**Sorun:** `name: "vite_react_shadcn_ts"` — Play Store'a yansımaz ama profesyonellik için düzeltilmeli.

**Dosya:** `package.json`
- `name` → `"golmetrik-ai"`
- `version` → `"1.0.0"`

---

### 3. INDEX.HTML — EKSİK OG META
**Sorun:** `og:url` ve `og:site_name` eksik. ASO (App Store Optimization) açısından deep link preview'ları etkilenir.

**Dosya:** `index.html`
- `og:url` → `https://golmetrik.app`
- `og:site_name` → `GolMetrik AI`

---

### 4. CAPACITOR CONFIG — iOS BLOĞU TEMİZLİĞİ
**Sorun:** `ios` bloğu var ama uygulama sadece Android. Gereksiz config karışıklık yaratabilir.

**Dosya:** `capacitor.config.ts`
- `ios` bloğunu kaldır (sadece Android app)

---

### 5. OFFLINE DENEYIM GÜÇLENDİRMESİ
**Sorun:** `useOnlineStatus` hook'u var ama `OfflineBanner` sadece basit bir banner. Play Store'da "uygulamanın çevrimdışı davranışı" test edilir.

**Dosya:** `src/components/OfflineBanner.tsx`
- Banner'a `role="alert"` ve `aria-live="assertive"` ekle (accessibility)

---

### 6. AUTH REDIRECT URL GÜVENLİĞİ
**Sorun:** `AuthContext.tsx`'de `emailRedirectTo` sabit olarak `https://golmetrikapp.lovable.app/callback` kullanıyor. Production'da native deep link (`golmetrik://callback`) kullanılmalı.

**Dosya:** `src/contexts/AuthContext.tsx`
- `Capacitor.isNativePlatform()` kontrolü ekle
- Native'de `golmetrik://callback`, web'de mevcut URL'yi kullan

---

### 7. SPLASH SCREEN SÜRESİ OPTİMİZASYONU
**Sorun:** `launchShowDuration: 2500` — 2.5sn uzun. Google Play performans testlerinde "yavaş başlangıç" olarak işaretlenebilir.

**Dosya:** `capacitor.config.ts`
- `launchShowDuration` → `1500` (1.5sn yeterli, zaten `launchAutoHide: false` ile kod kontrol ediyor)

---

### Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|-------|-------|
| `vite.config.ts` | Production console drop |
| `package.json` | name + version düzeltme |
| `index.html` | OG meta tamamlama |
| `capacitor.config.ts` | iOS bloğu kaldır, splash süre azalt |
| `src/components/OfflineBanner.tsx` | Accessibility attr ekle |
| `src/contexts/AuthContext.tsx` | Native redirect URL |

Fonksiyonalite değişikliği yok. Sadece production readiness ve Play Store uyumluluk iyileştirmeleri.

