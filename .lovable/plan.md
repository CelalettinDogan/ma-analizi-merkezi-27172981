

## Kapsamlı Audit & İyileştirme Planı — GolMetrik AI Android App

### Mevcut Durum Özeti

Uygulama teknik olarak iyi bir temele sahip: Capacitor 8, Google Play Billing, Supabase backend, hibrit AI/ML tahmin motoru, RLS güvenliği. Ancak Play Store premium standartlarına tam ulaşmak için aşağıdaki alanlarda iyileştirme gerekiyor.

---

### 1. PERFORMANS & BUNDLE OPTİMİZASYONU

**Sorun:** TabShell tüm 6 sayfayı eager import ediyor — ilk yükleme büyük bundle.

**Düzeltme:**
- `React.lazy()` + `Suspense` ile tab sayfalarını (Chat, Standings, Premium, Profile, Live) lazy load yap
- Sadece Index sayfası eager kalsın (ilk açılan sayfa)
- `TabShell.tsx` içinde import'ları `React.lazy(() => import(...))` ile değiştir

**Dosya:** `src/components/navigation/TabShell.tsx`

---

### 2. GÜVENLİK İYİLEŞTİRMELERİ

**Sorun:** Bazı edge function'lar `verify_jwt = false` ile çalışıyor ama kullanıcı verisi döndürüyor.

**Düzeltme:**
- `ai-chatbot` zaten internal auth yapıyor — OK
- `verify-purchase` internal auth yapıyor — OK
- `ml-prediction` ve `football-api` public data — OK
- `admin-cron-status` → admin kontrolü var mı doğrula

**Sorun:** `ErrorBoundary` production'da hata detayı göstermiyor ama `console.error` ile logluyor — Sentry veya benzeri crash reporting yok.

**Düzeltme:**
- ErrorBoundary'de opsiyonel crash reporting hook'u ekle (Supabase'e error log tablosu veya basit bir edge function)

**Dosyalar:** `src/components/ErrorBoundary.tsx`, yeni migration (opsiyonel `error_logs` tablosu)

---

### 3. UI/UX İYİLEŞTİRMELERİ

**3a. Profil Sayfası — Native Premium Hissi**
- Avatar'a gradient border ve subtle shadow ekle
- Plan badge'ini daha belirgin yap (admin için altın gradient)
- "Son Analizler" kartlarına subtle divider ve daha iyi touch feedback
- Ayarlar menüsü öğelerine haptic-style `active:scale-[0.98]` ekle

**3b. Home Sayfası — Boş Durum**
- Şu an ligler var ama maç yoksa sayfa tamamen boş (screenshot'ta görüldü)
- "Bugün maç yok" empty state ekle veya yaklaşan maçları göster

**3c. Auth Sayfası — Küçük İyileştirmeler**
- Kayıt sonrası e-posta doğrulama mesajı eksik (şu an direkt navigate ediyor)
- `auto-confirm` kapalıysa kullanıcı giriş yapamaz — doğrulama bekleme ekranı ekle

**Dosyalar:** `src/pages/Profile.tsx`, `src/pages/Index.tsx`, `src/pages/Auth.tsx`

---

### 4. ALGORİTMA & ANALİZ İYİLEŞTİRMELERİ

**4a. Analiz Caching**
- Aynı maç tekrar analiz edildiğinde hak düşmüyor (zaten fix edildi) ama analiz sonucu cache'lenmiyor
- Son 24 saat içinde aynı maç analiz edilmişse DB'den cached sonucu getir, yeni API çağrısı yapma

**4b. Prediction Accuracy Tracking**
- `auto-verify` edge function zaten var — iyi
- Kullanıcıya accuracy trend'i gösterme (son 30 gün) — Profile sayfasında mini chart

**Dosyalar:** `src/hooks/useMatchAnalysis.ts`, `src/pages/Index.tsx`

---

### 5. PLAY STORE UYUMLULUK

**5a. App Bundle Boyutu**
- Lazy loading ile initial JS bundle'ı küçült
- Kullanılmayan dependency'leri kontrol et (`@capgo/capacitor-social-login` aktif kullanılıyor mu?)

**5b. Accessibility**
- Tüm icon button'lara `aria-label` ekle
- Screen reader uyumluluğu için semantic HTML kontrol et
- BottomNav'daki butonlara `accessibilityLabel` ekle

**5c. Deep Link & App Links**
- `capacitor.config.ts`'de `androidScheme: 'https'` ve `hostname: 'golmetrik.app'` doğru — Digital Asset Links dosyası server'da var mı doğrula

**Dosyalar:** `src/components/navigation/BottomNav.tsx`, `package.json`

---

### 6. OFFLINE & NETWORK REZİLYANSI

**Sorun:** `OfflineBanner` var ama offline'da kullanıcı cached veri göremez.

**Düzeltme:**
- React Query `gcTime` zaten 10 dakika — offline'da cached veri gösterilir
- `persister` (AsyncStorage/localStorage) ekleyerek app restart sonrasında da cache korunsun

**Dosya:** `src/App.tsx` (QueryClient config)

---

### 7. KOD KALİTESİ & MAINTAINABILITY

- `src/pages/Profile.tsx` 659 satır — alt bileşenlere ayır (ProfileHeader, RecentAnalyses, SettingsMenu)
- `src/pages/Premium.tsx` — zaten refactor edildi, iyi durumda
- `src/hooks/useMatchAnalysis.ts` — 842 satır, çok büyük. `runFullAnalysis` ve `runLimitedAnalysis` ayrı dosyalara taşınabilir

---

### Öncelik Sıralaması

| Öncelik | Alan | Etki |
|---------|------|------|
| 1 | Lazy loading (TabShell) | Performans, bundle size |
| 2 | Auth e-posta doğrulama akışı | Kullanıcı kaybı önleme |
| 3 | Home boş durum iyileştirme | UX |
| 4 | Analiz sonucu caching | API maliyeti, UX |
| 5 | Accessibility (aria-labels) | Play Store uyumluluk |
| 6 | Profil sayfası refactor | Kod kalitesi |
| 7 | Error reporting | Debugging |
| 8 | Offline persistence | Resilience |

---

### Hangi İyileştirmeleri Yapalım?

Bu kapsamlı audit'i tek seferde uygulamak büyük risk. Hangilerini öncelikli yapmamı istersin?

