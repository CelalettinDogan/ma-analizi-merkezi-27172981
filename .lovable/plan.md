
# Admin Panel 2026 — Faz 1 (Quick Wins)

Tek oturumda bitirilebilir, mevcut yapıyı bozmadan üstüne katman ekleyen pro desktop-first iyileştirmeler. Mobil görünüm korunur (mevcut tab nav + drawer paterni).

## 1) Layout: Pro Desktop Shell

`src/components/admin/AdminLayout.tsx` güncelle:
- Masaüstünde shadcn `Sidebar` (collapsible="icon") — kalıcı, daraltılabilir, klavye ile gezilebilir.
- Üst bar (sticky, h-12): SidebarTrigger · Breadcrumb · Global arama (Command Palette tetikleyici, ⌘K rozeti) · Environment badge (Live/Test) · Refresh · Admin avatar.
- Mobil tab şeridi mevcut haliyle kalır.

## 2) Command Palette (⌘K / Ctrl+K)

Yeni: `src/components/admin/AdminCommandPalette.tsx` — shadcn `Command` + `CommandDialog`.
- Bölümlere atla (Dashboard, Kullanıcılar, Premium, AI, Bildirimler, Loglar, **Gelir**)
- Hızlı eylemler: "Analytics yenile", "Kullanıcı ara: …", "Premium ata", "Bildirim gönder"
- Kullanıcı arama: edge function `admin-users?search=` ile inline sonuç
- Klavye kısayolları: `g d` dashboard, `g u` users, `g r` revenue, `g a` ai, `?` shortcut yardımı, `r` aktif bölümü yenile

## 3) Dashboard: Trend Grafikleri & KPI Sparklines

`DashboardStats.tsx` zenginleştir (Recharts zaten projede yüklü):
- KPI kartlarına 14 günlük sparkline + ▲/▼ değişim yüzdesi
- Yeni "Aktivite Trendleri" kartı — son 30 günün `today_chats`, `today_analysis`, `active_users_24h` çoklu çizgi grafiği
- "Kullanıcı Büyümesi" kümülatif alan grafiği (`profiles.created_at` ile)
- Date range selector (7g/14g/30g/90g)
- Veri kaynağı: `admin_daily_analytics` tablosundan zaman serisi (`order by report_date desc limit 30`). Yeni hook: `useAnalyticsTimeSeries(days)`.

## 4) Yeni Bölüm: Gelir & Abonelik (MRR)

Yeni: `src/components/admin/RevenueManagement.tsx` + `AdminSection` enum'una `revenue` eklenir.
- KPI kartları: **MRR**, **ARPU**, **Active Subs**, **Churn (30g)**, **Trial→Paid dönüşüm**, **Refund/iptal sayısı**
- Plan bazlı dağılım (donut) + plan bazlı MRR (stacked bar)
- 30 günlük yeni abonelik / iptal akışı (line chart)
- Son 50 işlem tablosu (`premium_subscriptions` — user, plan, platform, starts_at, expires_at, auto_renewing, acknowledged)
- Hesaplamalar `useAdminData`'da `fetchRevenueStats` olarak — `premium_subscriptions` + `PLAN_PRICES`'dan client-side; expired vs active, trial filtresi.

## 5) Kullanıcı Yönetimi: Pro Desktop Tablosu

`UserManagement.tsx` + `admin-users` edge function:
- **Server-side arama**: `search` query param zaten desteklenir; debounce 300ms, sayfa sıfırlama.
- **Çoklu filtre çubuğu**: Plan (Free/Basic/Plus/Pro), Rol (admin/vip/moderator), Durum (aktif/banlı), Tarih aralığı, Aktivite (son 7g aktif).
- **Sıralanabilir kolonlar**: Kayıt tarihi, son giriş, kullanım.
- **Bulk seçim** (checkbox kolon) + toolbar: Toplu Premium ata, Toplu rol ekle, Toplu ban, CSV dışa aktar.
- **Kullanıcı detay drawer** (sağdan açılan `Sheet`): profil, abonelik geçmişi, son 30 günlük chat/analiz kullanım grafiği, son tahminleri, son aktivite logları, hızlı eylemler.

Edge function `admin-users` küçük güncelleme: filter parametreleri (`plan`, `role`, `status`, `from`, `to`) kabul etsin, `orderBy` desteği.

## 6) Klavye Kısayolları & Erişilebilirlik

Yeni hook: `src/hooks/admin/useAdminHotkeys.ts`
- ⌘K palette, `g + harf` navigation, `r` refresh, `?` help dialog, `Esc` modal kapat
- Tüm yeni butonlara `aria-label`, table'a `role="grid"`, focus ring tokenize.

## 7) Tasarım Sistemi Tutarlılığı

- Yeni renkler doğrudan değil — `text-primary`, `text-muted-foreground` gibi tokenler.
- Tüm grafikler `hsl(var(--primary))` türevi paletten beslenir; Recharts `<ChartContainer>` (zaten `components/ui/chart.tsx` mevcut) kullanılır.
- Kart radii 12px, 8px grid, mevcut Emerald/Amber paleti korunur.

## Teknik Detaylar

**Yeni dosyalar**
- `src/components/admin/AdminCommandPalette.tsx`
- `src/components/admin/AdminSidebar.tsx` (shadcn Sidebar)
- `src/components/admin/RevenueManagement.tsx`
- `src/components/admin/UserDetailSheet.tsx`
- `src/components/admin/UserFilters.tsx`
- `src/components/admin/charts/KpiSparkline.tsx`
- `src/components/admin/charts/ActivityTrendChart.tsx`
- `src/components/admin/charts/UserGrowthChart.tsx`
- `src/hooks/admin/useAnalyticsTimeSeries.ts`
- `src/hooks/admin/useRevenueStats.ts`
- `src/hooks/admin/useAdminHotkeys.ts`

**Düzenlenecek**
- `src/components/admin/AdminLayout.tsx` — desktop sidebar + topbar + breadcrumb + ⌘K
- `src/components/admin/UserManagement.tsx` — filtreler, sıralama, bulk, detay drawer
- `src/hooks/admin/useAdminData.ts` — `fetchRevenueStats`, `fetchAnalyticsTimeSeries`, `bulk*` aksiyonlar, server-side search/filter parametreleri
- `src/pages/Admin.tsx` — `revenue` section + `RevenueManagement` render
- `supabase/functions/admin-users/index.ts` — filter/order parametreleri (sadece okuma; mevcut RLS/admin koruması korunur)

**Veri kaynakları (mevcut, yeni tablo gerekmez)**
- `admin_daily_analytics` (zaman serisi)
- `premium_subscriptions` (MRR/churn/aktivasyon)
- `profiles.created_at` (büyüme)
- `chatbot_usage` / `analysis_usage` (kullanıcı detay grafikleri)

**Performans**
- Time-series fetch'ler `staleTime: 5dk` ile React Query benzeri davranış (mevcut pattern: useCallback + loadedSections ref).
- Tablo virtualization gerek görülürse Faz 2'ye bırakılır (20/sayfa pagination yeterli).

## Kapsam Dışı (Faz 2+ için not)
- Realtime websocket KPI sayaçları
- Feature Flags modülü
- Cohort/retention matrisi
- Edge function log viewer
- Prompt versiyonlama & A/B test
