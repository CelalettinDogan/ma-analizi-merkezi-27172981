

## Plan: Play Store Uyumluluk İyileştirmeleri

### 1. ACCESSIBILITY — aria-label Eksiklikleri

Şu anda sadece `BottomNav`, `Onboarding`, `ThemeToggle`, `AppFooter` ve `AnalysisDrawer` aria-label içeriyor. Aşağıdaki bileşenlere aria-label eklenmeli:

**Dosyalar ve eklenecek aria-label'lar:**

| Dosya | Eksik Eleman | Eklenecek |
|-------|-------------|-----------|
| `src/components/layout/AppHeader.tsx` | Logo link | `aria-label="Ana sayfa"` |
| `src/components/UserMenu.tsx` | Avatar dropdown trigger | `aria-label="Kullanıcı menüsü"` |
| `src/components/ShareCard.tsx` | Paylaş/Kopyala/İndir butonları | `aria-label="Paylaş"` vb. |
| `src/components/chat/ChatInput.tsx` | Gönder butonu | `aria-label="Mesaj gönder"` |
| `src/components/chat/ChatMessage.tsx` | Kopyala/Beğen/Beğenme butonları | `aria-label="Kopyala"` vb. |
| `src/components/LiveMatchCard.tsx` | Tıklanabilir kart | `aria-label` match info ile |
| `src/components/analysis/AIRecommendationCard.tsx` | Genişlet/disclaimer butonları | `aria-label` ekle |
| `src/components/analysis-set/AnalysisSetButton.tsx` | FAB butonu | `aria-label="Analiz seti"` |
| `src/components/analysis-set/AnalysisSetItem.tsx` | Sil butonu | `aria-label="Kaldır"` |
| `src/components/admin/UserManagement.tsx` | MoreVertical icon button | `aria-label="Kullanıcı işlemleri"` |
| `src/components/PullToRefresh.tsx` | Pull indicator | `role="status"` + `aria-label` |
| `src/pages/Premium.tsx` | Plan kartları | `role="radio"` + `aria-label` |

---

### 2. KULLANILMAYAN DEPENDENCY TEMİZLİĞİ

UI bileşen dosyaları var ama hiçbir yerde import edilmiyor — bunlar kaldırılmamalı (shadcn convention). Ama `package.json`'dan kullanılmayan Radix paketleri temizlenebilir:

**Kullanılmayan paketler (hiçbir dosya import etmiyor):**
- `@radix-ui/react-hover-card` (sadece `ui/hover-card.tsx` var, hiçbir yerde kullanılmıyor)
- `@radix-ui/react-context-menu` (sadece `ui/context-menu.tsx`)
- `@radix-ui/react-menubar` (sadece `ui/menubar.tsx`)
- `@radix-ui/react-navigation-menu` (sadece `ui/navigation-menu.tsx`)
- `@radix-ui/react-aspect-ratio` (sadece `ui/aspect-ratio.tsx`)
- `input-otp` (sadece `ui/input-otp.tsx`)
- `react-resizable-panels` (sadece `ui/resizable.tsx`)

**Kaldırılacak UI dosyaları (hiçbir yerden import edilmiyor):**
- `src/components/ui/hover-card.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/aspect-ratio.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/ui/resizable.tsx`
- `src/components/ui/calendar.tsx` (lucide Calendar ikonu kullanılıyor, UI bileşeni değil)
- `src/components/ui/pagination.tsx`
- `src/components/ui/breadcrumb.tsx`

**Ayrıca `react-day-picker`** sadece `calendar.tsx` tarafından kullanılıyor → calendar silinince bu da kaldırılabilir.

---

### 3. DEEP LINK DOĞRULAMA

Mevcut deep link yapısı incelendiğinde:
- `capacitor.config.ts`: `androidScheme: 'https'`, `hostname: 'golmetrik.app'` ✅
- `DeepLinkHandler` (App.tsx): `golmetrik://callback` ve `golmetrik://reset-password` dinleniyor ✅
- `AuthCallback.tsx`: Web'de `golmetrik://callback` redirect yapıyor ✅

**İyileştirme:**
- `AuthCallback.tsx`'de deep link redirect'e token parametrelerini aktarma: Şu an `golmetrik://callback` düz gidiyor, ama `DeepLinkHandler`'da `appUrlOpen` event'i URL hash'ten token'ları alıyor → Bu zaten doğru çalışıyor çünkü web callback URL'i hash'te token taşıyor.
- `handleOpenApp`'e `access_token` ve `refresh_token`'ı ekleyerek daha güvenilir yap (token'ların kaybolmaması için)
- Geçersiz/süresi dolmuş token durumunda error state göster

**Dosya: `src/pages/AuthCallback.tsx`**
- Token'ları parse edip `golmetrik://callback#access_token=...&refresh_token=...` şeklinde redirect yap
- Token yoksa ama `type=signup` varsa → "Uygulamayı açıp giriş yapın" mesajı göster

---

### Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|-------|-------|
| `src/components/layout/AppHeader.tsx` | aria-label ekle |
| `src/components/UserMenu.tsx` | aria-label ekle |
| `src/components/ShareCard.tsx` | aria-label ekle |
| `src/components/chat/ChatInput.tsx` | aria-label ekle |
| `src/components/chat/ChatMessage.tsx` | aria-label ekle |
| `src/components/LiveMatchCard.tsx` | aria-label ekle |
| `src/components/analysis/AIRecommendationCard.tsx` | aria-label ekle |
| `src/components/analysis-set/AnalysisSetButton.tsx` | aria-label ekle |
| `src/components/analysis-set/AnalysisSetItem.tsx` | aria-label ekle |
| `src/components/admin/UserManagement.tsx` | aria-label ekle |
| `src/pages/Premium.tsx` | role + aria-label ekle |
| `src/pages/AuthCallback.tsx` | Deep link token aktarımı |
| `package.json` | 7 unused dependency kaldır |
| 10 UI dosya | Sil (kullanılmayan bileşenler) |

Fonksiyonalite değişikliği yok. Sadece accessibility, temizlik ve deep link güvenilirliği iyileştirmesi.

