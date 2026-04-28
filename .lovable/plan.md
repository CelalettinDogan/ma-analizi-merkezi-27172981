## Plan: Çoklu Dil Desteği (i18n) — Capacitor Native App

### Stratejik Karar

**Tek AAB + uygulama içi i18n** yaklaşımı kullanılacak. Play Store'a tek paket yüklenecek, dünyanın her yerinden indirilebilecek. Uygulama açıldığında:
1. Cihaz dilini otomatik algılar (Capacitor `Device.getLanguageCode()`)
2. Desteklenen dilse o dilde açılır, değilse İngilizce'ye düşer
3. Kullanıcı header'daki 🌐 simgesinden manuel değiştirebilir
4. Seçim `localStorage` + Capacitor `Preferences` ile kalıcı saklanır

### Desteklenecek Diller (Faz 1)

| Dil | Kod | Hedef Pazar |
|-----|-----|-------------|
| Türkçe | `tr` | TR (varsayılan / mevcut) |
| İngilizce | `en` | Global fallback |
| Almanca | `de` | DE, AT, CH (Türk diasporası büyük) |
| Arapça | `ar` | Orta Doğu (futbol pazarı çok büyük) — RTL desteği dahil |
| İspanyolca | `es` | LATAM + İspanya (futbol pazarı dev) |

> Faz 2'de Fransızca (`fr`), Portekizce (`pt-BR`), Endonezce (`id`) eklenebilir.

---

### Yapılacak İşler

**1. Bağımlılıklar**
- `i18next`
- `react-i18next`
- `i18next-browser-languagedetector`
- `@capacitor/preferences` (kalıcı dil tercihi için)

**2. Klasör Yapısı**
```text
src/
├── i18n/
│   ├── config.ts                    # i18next init + dil algılama
│   ├── languages.ts                 # SUPPORTED_LANGUAGES sabiti
│   └── locales/
│       ├── tr/
│       │   ├── common.json          # Genel UI: butonlar, navigasyon
│       │   ├── auth.json            # Giriş/kayıt ekranı
│       │   ├── home.json            # Anasayfa, hero, maç kartları
│       │   ├── analysis.json        # Analiz/tahmin ekranı
│       │   ├── premium.json         # Premium + satın alma
│       │   ├── profile.json         # Profil + ayarlar
│       │   └── predictions.json     # "Maç Sonucu", "İY/MS" vb.
│       ├── en/ (aynı yapı)
│       ├── de/
│       ├── ar/
│       └── es/
└── components/
    └── LanguageSwitcher.tsx         # Header'a eklenecek 🌐 dropdown
```

**3. Cihaz Dili Algılama (Capacitor)**

`src/i18n/config.ts` içinde:
- Önce `Preferences.get({ key: 'app-language' })` ile kullanıcı tercihi kontrol edilir
- Yoksa Capacitor `Device.getLanguageCode()` ile cihaz dili alınır
- Cihaz dili desteklenenlerden biriyse kullanılır, değilse `en` fallback
- Web/PWA fallback: `navigator.language`

**4. RTL Desteği (Arapça için)**
- `<html dir="rtl">` dinamik olarak set edilir (Arapça seçildiğinde)
- Tailwind'in `rtl:` variant'ı ile kritik bileşenlerde (BottomNav, Drawer, MatchCard) yön düzeltmeleri

**5. Mevcut Hardcoded Metinleri Çevirme**

Öncelik sırası (toplam ~300-400 string):
1. **Yüksek öncelik (Faz 1):** AppHeader, BottomNav, Onboarding, Auth, HeroSection, PremiumUpgrade, Settings — kullanıcının ilk gördüğü ekranlar
2. **Orta öncelik (Faz 1):** PredictionCard, MatchCard, AnalysisDrawer, predictions.ts sabitleri
3. **Düşük öncelik (Faz 2):** Admin panel (sadece adminler kullanır, TR kalabilir), ileri analiz tab'leri

**6. Header'a Dil Seçici Ekleme**
- `src/components/LanguageSwitcher.tsx` — 🌐 globe ikon + dropdown
- `AppHeader.tsx` içinde UserMenu yanına yerleştirilir
- Her dil kendi yazısıyla gösterilir: "Türkçe, English, Deutsch, العربية, Español"

**7. Dinamik İçerik (API'den gelen Türkçe metinler)**
- AI chatbot ve analiz açıklamaları şu an Türkçe geliyor (edge function'larda Türkçe prompt)
- `ai-chatbot` ve `ml-prediction` edge function'larına `language` parametresi eklenecek
- Prompt: "Respond in {language}" şeklinde dinamik olacak
- Frontend i18n ile aktif dil edge function'a iletilir

**8. Tarih/Saat/Sayı Formatları**
- Zaten kullanılan `date-fns` paketinde locale dinamik yüklenir (`tr`, `enUS`, `de`, `ar`, `es`)
- Para birimi (Premium fiyatları): Play Store'dan zaten lokalize geliyor (`useStoreProducts` hook'u)

---

### Play Store Tarafı (Kod Değil — Console İşi)

Plan onaylanırsa kullanıcıya ayrıca şu rehberi vereceğim:

**Play Console → Store presence → Main store listing:**
- "Manage translations" → Add translation
- En az şu diller eklenmeli: TR (mevcut), EN-US, DE, AR, ES
- Her dil için ayrı: Uygulama adı, kısa açıklama, uzun açıklama, ekran görüntüleri (opsiyonel)

**Play Console → Production → Countries/regions:**
- "Add countries/regions" → All countries seç (veya istediğin pazarlar)

**versionCode artırımı:** `android/app/build.gradle` içinde `versionCode` +1, sonra `npm run build && npx cap sync android` (yerel ortamda).

---

### Teknik Notlar

- Mevcut `predictions.ts` dosyasındaki `PREDICTION_TYPE_LABELS` gibi sabitler **silinmeyecek** — bunun yerine i18n key'lerine referans verecek wrapper hook (`usePredictionLabels()`) yazılacak. Geriye uyumluluk korunur.
- AuthContext / mevcut hook'lar değişmez.
- Capacitor `Preferences` plugin'i zaten dolaylı olarak `@capgo/native-purchases` ile geliyor olabilir; değilse eklenecek.
- Tahmini değişen dosya sayısı: ~25 (yeni 12 dosya + ~13 mevcut dosyada metin → t() dönüşümü).

### Kapsam Dışı (Bu Planda Yok)

- Admin paneli çevirisi (Faz 2)
- Edge function'ların tamamının çok dilli yanıtı (sadece chatbot + analiz açıklaması Faz 1'de)
- Push bildirimlerinin çok dilli olması (Faz 2)
- Play Store screenshot'larının her dil için yeniden tasarlanması (manuel iş, kullanıcının yapacağı)
