
# GolMetrik -> GolMetrik AI Rebranding + Header Logo Iyilestirmesi

## 1. Marka Adi Degisikligi: "GolMetrik" -> "GolMetrik AI"

Tum dosyalarda "GolMetrik" ifadesi "GolMetrik AI" olarak guncellenecek. E-posta adresleri, appId, hostname, localStorage key'leri ve URL'ler gibi teknik tanimlar degismeyecek (bunlar marka adi degil, teknik identifier).

### Degisecek Dosyalar ve Satirlar

**`index.html`**:
- Title: "GolMetrik AI - AI Destekli Futbol Tahmin Platformu"
- Author: "GolMetrik AI"
- OG title: "GolMetrik AI - AI Mac Tahminleri"
- Twitter title: "GolMetrik AI - AI Mac Tahminleri"

**`public/manifest.json`**:
- name: "GolMetrik AI"
- short_name: "GolMetrik AI"

**`capacitor.config.ts`**:
- appName: "GolMetrik AI"

**`src/components/layout/AppHeader.tsx`**:
- alt text ve brand text: "GolMetrik AI"

**`src/components/layout/AppFooter.tsx`**:
- Brand text: "GolMetrik AI"
- Copyright: "GolMetrik AI"

**`src/pages/Auth.tsx`**:
- Logo alt, h1, ve icerik metinlerindeki "GolMetrik" -> "GolMetrik AI"

**`src/pages/Premium.tsx`**:
- "GolMetrik Premium" -> "GolMetrik AI Premium"

**`src/pages/Terms.tsx`**:
- Tum "GolMetrik" referanslari -> "GolMetrik AI"

**`src/pages/Privacy.tsx`**:
- Tum "GolMetrik" referanslari -> "GolMetrik AI"

**`src/pages/Profile.tsx`**:
- Icerik metinlerindeki "GolMetrik" -> "GolMetrik AI"

**`src/components/Onboarding.tsx`**:
- "GolMetrik'e Hos Geldin!" -> "GolMetrik AI'a Hos Geldin!"

**`src/components/admin/AdminLayout.tsx`**:
- "GolMetrik" -> "GolMetrik AI"

**`supabase/functions/ai-chatbot/index.ts`**:
- System prompt: "GolMetrik'in" -> "GolMetrik AI'in"

### Degismeyecekler (teknik identifier'lar)
- `app.golmetrik.android` (appId)
- `golmetrik.app` (hostname)
- `info@golmetrik.com`, `destek@golmetrik.com` (e-posta)
- `golmetrik_onboarding_completed` (localStorage key)
- `golmetrik-notification-settings` (localStorage key)
- `golmetrik_recent_searches` (localStorage key)
- Play Store URL

---

## 2. Header Logo - Daha Buyuk ve Native 1:1

`AppHeader.tsx`'deki logo simdi `w-9 h-9` (36px) boyutunda ve `object-contain` kullaniyor. Daha gorunur ve native hissiyat icin:

- Boyut: `w-10 h-10 sm:w-11 sm:h-11` (40-44px)
- `object-contain` yerine `aspect-square object-cover` (1:1 kare, native stil)
- `rounded-xl` eklenerek kosesel native gorunum
- Hover glow efektini korumak

### Teknik Detay

```text
// Mevcut:
<img src={logoImage} className="w-9 h-9 sm:w-10 sm:h-10 object-contain ..." />

// Yeni:
<img src={logoImage} className="w-10 h-10 sm:w-11 sm:h-11 aspect-square object-cover rounded-xl shadow-sm ..." />
```

---

## Toplam: ~15 dosya degisecek, tamaminda basit metin degisikligi + 1 dosyada logo boyut/stil guncellemesi
