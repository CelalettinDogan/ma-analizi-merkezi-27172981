# Tam Çeviri Tamamlama Planı

## Sorun
Uygulama 5 dili destekliyor (TR, EN, DE, ES, AR) ancak **53 dosyada** hâlâ sabit Türkçe metinler var. Dil değiştirildiğinde bu metinler Türkçe olarak kalıyor. Tespit edilen noktalar:

- **Dashboard kartları**: `AccuracyHeroCard`, `QuickStatsGrid`, `PredictionTypePills`, `ActivityFeed`, `MLPerformanceCard`, `RecentPredictions`, `StatsOverview`, `AILearningBar`, `AutoVerifyButton`, `PredictionTypeChart`
- **Analiz bileşenleri**: `AnalysisHeroSummary`, `AdvancedAnalysisTabs`, `AIRecommendationCard`, `CollapsibleAnalysis`, `PredictionPillSelector`, `AnalysisSection`, `SimilarMatchesSection`
- **Maç kartları**: `PredictionCard`, `TeamStatsCard`, `MatchContextCard`, `PowerComparisonCard`, `HeadToHeadCard`, `TodaysMatches`, `H2HSummaryBadge`, `LiveMatchCard2`
- **Standings**: `StandingsTable`, `GoalStatsTab`, `FormAnalysisTab`
- **Chat**: `ChatContainer`, `ChatInput`, `ChatMessage`
- **Premium**: `PremiumUpgrade`
- **Streak/Rewards**: `StreakRewardsCard`, `Rewards.tsx`
- **Profil & UI**: `NotificationSettings`, `ThemeToggle`, `PullToRefresh`, `ShareCard`, `AnalysisSetDrawer`, `AnalysisSetItem`
- **Charts**: `ConfidenceVisualizer`, `ScorePredictionChart`
- **Sayfalar**: `Premium.tsx`, `Auth.tsx`, `Chat.tsx`
- **Admin paneli**: `UserManagement`, `PremiumManagement`, `NotificationManagement`, `DashboardStats`, `AdminLayout`, `ActivityLog`, `AIManagement`, `Admin.tsx` (admin sadece TR'de kalabilir, aşağıda soruluyor)

Toplam ~100+ JSX metni + 41 string literal sabit Türkçe.

## Yaklaşım

### 1. Locale dosyalarına yeni anahtarlar ekleme
Mevcut namespace yapısını koruyarak şu dosyalara ekleme yapılacak:
- `common.json` → ortak butonlar, etiketler (Hücum, Savunma, Doğru, Yanlış, Başarılı, vb.)
- `analysis.json` → analiz/tahmin kartı metinleri
- `home.json` → maç listesi/kart metinleri
- `chat.json` → chat UI metinleri (Faydalı, Geliştirilmeli)
- `premium.json` → premium upgrade ek metinleri
- `profile.json` → bildirim ayarları, tema
- Yeni: `dashboard.json` ve `standings.json` namespace'leri (çok sayıda anahtar olduğu için ayrılır)

Her anahtar **5 dilin tamamına** (TR, EN, DE, ES, AR) çevrilecek.

### 2. Bileşenleri `useTranslation` ile güncelleme
Her dosyada:
- `useTranslation('namespace')` hook'u eklenecek
- Sabit string'ler `{t('key')}` ile değiştirilecek
- `aria-label`, `placeholder`, `title` gibi attribute'lar dahil edilecek
- Plural ve interpolasyon gerektirenler (`{{count}}`) i18next sözdizimi ile yazılacak

### 3. i18n config güncellemesi
`src/i18n/config.ts` içine yeni `dashboard` ve `standings` namespace'leri eklenecek; tüm dillerde import edilecek.

### 4. Kalite kontrol
- `rg -nP '[İıĞğŞşÇçÖöÜü]'` ile son tarama yapılarak kaçan metin olmadığı doğrulanacak (admin hariç tutulursa o dosyalar muaf).
- Dil değiştirici ile EN/DE/ES/AR sırayla doğrulanacak.

## Açıklama (Teknik olmayan özet)
Uygulama 5 dile çevrildi ama bazı butonlar, etiketler ve mesajlar yanlışlıkla Türkçe kodlanmış. Bu plan, tüm bu metinleri tespit edip çeviri sistemine taşır ve 5 dilin tamamına çevirir. Sonuç: dil değiştirildiğinde her şey o dile geçer.

## Soru: Admin paneli çevrilsin mi?
Admin paneli (`/admin` altındaki sayfalar) yalnızca yönetici kullanıcılar tarafından görüldüğü için genelde tek dilde (TR) bırakılır. İki seçenek var:

- **A) Sadece kullanıcıya açık ekranlar çevrilsin** (admin TR kalsın) → daha hızlı, daha küçük locale dosyaları.
- **B) Admin de dahil her şey çevrilsin** → tutarlı ama ~30% daha fazla iş.

Plan onaylanırken hangisini tercih ettiğinizi belirtirseniz ona göre uygularım. Belirtmezseniz **A**'yı varsayılan kabul edeceğim.
