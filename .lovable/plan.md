

## Plan: Admin Paneli — Kritik Sorunlar ve İyileştirmeler

### Tespit Edilen Sorunlar

| # | Sorun | Etki | Dosya |
|---|-------|------|-------|
| 1 | **Scroll sorunu**: AdminLayout `main` alanı `overflow-auto` ama `flex-1` ile sınırsız büyüyor — mobilde scroll çalışmıyor | Kritik | AdminLayout.tsx |
| 2 | **Mobil tab nav sticky pozisyon hatası**: `top-[calc(env(safe-area-inset-top)+44px)]` sabit değer, header yüksekliği ile uyuşmuyor olabilir | Orta | AdminLayout.tsx |
| 3 | **sectionLoading sadece ilk yüklemede**: `loadedSections.current.has(section)` nedeniyle bir sekme bir kez yüklendikten sonra refresh yapılmıyor, `sectionLoading` false kalıyor — refresh butonları loading göstermiyor | Orta | useAdminData.ts |
| 4 | **AI sekmesinde TabsList 5 kolon sıkışıklığı**: `grid-cols-5` mobilde okunmaz derecede küçülüyor | Kritik | AIManagement.tsx |
| 5 | **Notification geçmiş tablosu mobilde yatay scroll**: Table bileşeni mobilde responsive değil | Orta | NotificationManagement.tsx |
| 6 | **ActivityLog sabit `h-[600px]` ScrollArea**: Mobilde viewport'tan taşıyor, dış scroll ile çakışıyor | Orta | ActivityLog.tsx |
| 7 | **DashboardStats grid `grid-cols-6`**: Mobilde `grid-cols-2` var ama orta ekranlarda `grid-cols-3` ve `grid-cols-6` arası boşluk yok | Düşük | DashboardStats.tsx |
| 8 | **Console error**: Badge component ref uyarısı AIManagement'ta | Düşük | AIManagement.tsx |

---

### 1. SCROLL DÜZELTME — AdminLayout
**Dosya:** `src/components/admin/AdminLayout.tsx`

- Ana container `flex min-h-screen` → `flex h-screen overflow-hidden` yap
- `flex-1 flex flex-col min-w-0` → `flex-1 flex flex-col min-w-0 overflow-hidden`
- `main` elementine `flex-1 overflow-y-auto` ekle, sabit `min-h` kaldır
- Mobil header ve tab nav sticky pozisyonları düzelt

### 2. SECTİON LOADING & REFRESH DÜZELTMESİ
**Dosya:** `src/hooks/admin/useAdminData.ts`

- Refresh fonksiyonlarına (`refreshUsers`, `refreshDashboard` vb.) loading state ekle
- `loadSection` fonksiyonunu her zaman `sectionLoading` güncelleyecek şekilde düzelt (cache kontrolü kaldır veya refresh'te bypass et)
- Her refresh fonksiyonunu `setSectionLoading(true)` ile wrap et

### 3. AI TABS MOBİL RESPONSİVE
**Dosya:** `src/components/admin/AIManagement.tsx`

- `TabsList grid-cols-5` → mobilde horizontal scroll ile `flex overflow-x-auto` yap
- Badge ref uyarısını düzelt (Badge'i div ile wrap et veya ref kullanımını kaldır)

### 4. NOTİFİCATİON GEÇMİŞ — MOBİL KART
**Dosya:** `src/components/admin/NotificationManagement.tsx`

- Bildirim geçmişi tablosunu mobilde kart listesine çevir (`useIsMobile()`)
- Masaüstünde mevcut tablo korunsun

### 5. ACTİVİTY LOG — DİNAMİK YÜKSEKLİK
**Dosya:** `src/components/admin/ActivityLog.tsx`

- `h-[600px]` → `max-h-[60vh]` veya dinamik hesaplama
- Mobilde daha kısa yükseklik

### 6. DASHBOARD STATS — GRID DÜZELTMESİ
**Dosya:** `src/components/admin/DashboardStats.tsx`

- `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` → `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` daha smooth geçiş

---

### Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|-------|-------|
| `src/components/admin/AdminLayout.tsx` | Scroll düzeltme, layout fix |
| `src/hooks/admin/useAdminData.ts` | Refresh loading state düzeltme |
| `src/components/admin/AIManagement.tsx` | Tabs responsive, Badge ref fix |
| `src/components/admin/NotificationManagement.tsx` | Mobil kart görünümü |
| `src/components/admin/ActivityLog.tsx` | Dinamik yükseklik |
| `src/components/admin/DashboardStats.tsx` | Grid breakpoint iyileştirme |

Fonksiyonalite değişmez. Scroll, responsive ve loading state düzeltmeleri.

