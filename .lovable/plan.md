## Hedef
Uygulamadaki tüm hardcoded Türkçe metinleri `useTranslation` hook'una taşıyarak 5 dil desteğini (TR, EN, DE, ES, AR + RTL) tüm sayfa ve bileşenlere yaymak.

## Mevcut Durum
- ✅ i18n altyapısı kurulu (`src/i18n/`)
- ✅ 7 namespace × 5 dil = 35 JSON dosyası mevcut
- ✅ Çevrilmiş: `BottomNav`, `AppHeader`, `Profile` + alt bileşenleri, `LanguageSwitcher`
- ❌ Çevrilmemiş: ~75 bileşen + 13 sayfa (~22K satır)

## Kapsam Dışı (Bu Plan)
- **Admin paneli** (`Admin.tsx`, `src/components/admin/*`) → sadece TR (yönetici aracı)
- **Yasal metinler uzun içerikleri** (Privacy/Terms) → başlıklar çevrilir, içerik TR kalır + disclaimer
- **AI Chatbot edge function yanıtları** → ayrı bir görev (model'e dil parametresi geçirme)
- **Veritabanı içerikleri** (lig adları, takım adları) → API'den geldiği gibi

## Uygulama Fazları

### Faz 1 — Onboarding + Auth (Giriş kapısı, en kritik)
- `Onboarding.tsx`, `Auth.tsx`, `AuthCallback.tsx`, `ResetPassword.tsx`, `DeleteAccount.tsx`
- `src/components/auth/*` (LoginForm, RegisterForm, vb.)
- Namespace: `auth.json` genişletilecek (~40 yeni anahtar)
- Tahmini: ~80 string

### Faz 2 — Ana Sayfa & Maç Listesi
- `Index.tsx`, `HeroSection.tsx`, `TodaysMatches.tsx`, `UpcomingMatches.tsx`
- `MatchCard`, `LeagueSelector`, `LeagueGrid`, `LiveMatchesSection`, `LiveMatchCard`
- `EmptyState`, `OfflineBanner`, `PullToRefresh`, `MatchInsightBadges`
- Namespace: `home.json` + yeni `match.json`
- Tahmini: ~120 string

### Faz 3 — Analiz Akışı (Çekirdek özellik)
- `MatchInputForm`, `TeamSelector`, `AnalysisSection`, `PredictionCard`
- `TeamStatsCard`, `PowerComparisonCard`, `MatchContextCard`, `HeadToHeadCard`
- `SimilarMatchesSection`, `FilteredPredictionsSection`, `AdvancedFilters`, `ShareCard`
- `src/components/analysis/*`, `src/components/analysis-set/*`, `src/components/charts/*`
- `AnalysisHistory.tsx`
- Namespace: `analysis.json` + `predictions.json` genişletilecek (~80 yeni anahtar)
- Tahmini: ~250 string (en büyük faz)

### Faz 4 — Premium, Live, Standings, Chat
- `Premium.tsx` + `src/components/premium/*` (PremiumGate, plan kartları)
- `Live.tsx` + `src/components/live/*`
- `Standings.tsx` + `src/components/standings/*`
- `Chat.tsx` + `src/components/chat/*` (UI etiketleri; bot yanıtları hariç)
- Namespace: `premium.json` genişletilecek + yeni `live.json`, `standings.json`, `chat.json`
- Tahmini: ~150 string

### Faz 5 — Diğer & Cilalama
- `NotFound.tsx`, `Privacy.tsx`, `Terms.tsx` (başlıklar)
- `LegalDisclaimer`, `ThemeToggle`, `UserMenu`, `NavLink`
- Toast mesajları (uygulama genelinde `sonner` çağrıları)
- `MatchHeader` ve diğer kalan utility bileşenler
- date-fns lokalizasyonu kontrolü, RTL düzen testleri (Arapça için flex-direction)
- Tahmini: ~80 string

## Teknik Yaklaşım

**Her faz için tutarlı süreç:**
1. İlgili bileşenleri tara → tüm Türkçe metinleri tespit et
2. 5 dil için JSON dosyalarına anahtar ekle (TR doğal dil, diğerleri profesyonel çeviri)
3. Bileşenlere `const { t } = useTranslation('namespace')` ekle
4. Hardcoded stringleri `{t('key')}` ile değiştir
5. Dinamik içerikler için interpolation kullan: `t('welcome', { name })`
6. Tarih/sayı formatlama için `date-fns` lokali ve `Intl.NumberFormat` ile dil senkronizasyonu

**Çeviri kalite standardı:**
- Spor/bahis terminolojisi → her dilde standart karşılıkları (xG, form, momentum vb.)
- Kısa UI etiketleri → mobil ekran sınırlarına uygun (Almanca uzun kelimeler için dikkat)
- Arapça → RTL akışı + sayısal değerler için LTR override (`dir="ltr"` numerik span'ler)

**Çakışma önleme:**
- Mevcut anahtarlar bozulmayacak; sadece yeni anahtar eklenecek
- Namespace'ler mantıksal gruplara göre genişletilecek

## Uygulama Sırası ve Onay

Bu plan onaylanırsa **Faz 1'den başlayarak sırayla** uygulayacağım. Her fazın sonunda kısa bir özet vereceğim, böylece preview'da kontrol edip bir sonrakine geçebilirsin. Tüm fazlar tahmini 5 ayrı build döngüsü sürecek (her faz tek mesajda tamamlanacak).

İstersen sıralamayı değiştirebilir veya bir fazı atlayabilirsin.
