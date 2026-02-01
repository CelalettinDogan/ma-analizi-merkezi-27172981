

# GolMetrik - Web Tabanlı Admin Panel Planı

## Genel Bakış
Mevcut Android uygulaması için kapsamlı bir web tabanlı admin panel oluşturulacak. Panel, mobil uygulama ile aynı Supabase backend'ini kullanarak kullanıcı, premium, içerik ve bildirim yönetimini sağlayacak.

---

## Mevcut Altyapı Analizi

### Mevcut Durum
| Bileşen | Durum |
|---------|-------|
| Admin sayfası | Sadece Cron Job izleme (basit) |
| Rol sistemi | `user_roles` tablosu mevcut (admin, moderator, user, vip) |
| Premium sistemi | `premium_subscriptions` tablosu mevcut |
| AI Chatbot | Edge function mevcut, sistem promptu düzenlenebilir |
| Push bildirimi | Altyapı YOK (oluşturulacak) |

### Kullanılacak Tablolar
- `auth.users` (salt okunur referans)
- `profiles` (kullanıcı bilgileri)
- `user_roles` (rol yönetimi)
- `premium_subscriptions` (abonelik yönetimi)
- `chatbot_usage` (AI kullanım)
- `analysis_usage` (analiz kullanım)
- `predictions` (tahminler)
- `cached_matches` (maç verileri)

---

## Admin Panel Modülleri

### 1. Dashboard (Ana Sayfa)
- Günlük aktif kullanıcı (DAU)
- Toplam kullanıcı sayısı
- Premium kullanıcı sayısı / oranı
- Günlük analiz sayısı
- Günlük chat mesajı sayısı
- AI tahmin başarı oranı
- Canlı maç sayısı

### 2. Kullanıcı Yönetimi
**Liste Görünümü:**
- Email, kayıt tarihi, son giriş
- Plan durumu (Free/Basic/Plus/Pro)
- Günlük chat/analiz kullanımı
- Roller (admin, moderator, vip)

**Kullanıcı İşlemleri:**
- Premium paketi manuel atama
- Rol ekleme/kaldırma (admin, moderator, vip)
- Kullanıcı askıya alma (is_banned flag)
- Kullanıcı detayları görüntüleme

### 3. Premium Yönetimi
**Paket Listesi:**
- Mevcut paketler (Basic, Plus, Pro)
- Fiyatlar ve limitler
- Aktif abone sayısı per paket

**Manuel Premium Atama:**
- Kullanıcı seçimi
- Paket tipi seçimi
- Süre belirleme (1 ay, 3 ay, 6 ay, 1 yıl)

### 4. AI & Analiz Kontrolü
**İstatistikler:**
- Toplam tahmin sayısı
- Doğrulama oranı per kategori
- Günlük analiz kullanımı grafiği

**Prompt Yönetimi:**
- AI sistem promptunu görüntüleme
- Prompt düzenleme (veritabanında saklanacak)
- Banned patterns yönetimi

**Tahmin İnceleme:**
- Tahmin listesi
- Hatalı tahminleri işaretleme
- Doğrulama geçmişi

### 5. Maç & İçerik Yönetimi
**Maç Listesi:**
- Önümüzdeki maçlar
- Canlı maçlar
- Bitmiş maçlar

**İşlemler:**
- "Büyük Maç" olarak işaretleme
- Lig bazlı aç/kapat
- Öne çıkan maçları belirleme

### 6. Push Bildirim Yönetimi (Yeni Altyapı)
**Gerekli Yeni Tablolar:**
- `push_tokens` (FCM token'ları)
- `push_notifications` (bildirim geçmişi)

**Özellikler:**
- Toplu bildirim gönderme
- Hedef kitle seçimi (tüm/free/premium)
- Zamanlı bildirim
- Bildirim şablonları
- Tıklama istatistikleri

### 7. İstatistik & Raporlama
**Grafikler:**
- DAU/WAU/MAU trendi
- Premium dönüşüm oranı
- Analiz kullanım trendi
- Chat kullanım trendi

**Raporlar:**
- Haftalık özet
- Premium gelir tahmini
- Churn oranı

### 8. Güvenlik & Loglar
**Admin Aktivite Logu:**
- Kim, ne zaman, ne yaptı
- İşlem detayları

**Rate Limiting:**
- API çağrı limitleri izleme
- Şüpheli aktivite uyarıları

---

## Teknik Uygulama Planı

### Yeni Veritabanı Tabloları

```text
-- 1. Kullanıcı askıya alma desteği
ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN ban_reason TEXT;

-- 2. Push bildirim tokenları
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'android',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- 3. Bildirim geçmişi
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  target_audience TEXT DEFAULT 'all', -- all, free, premium
  sent_by UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Admin aktivite logu
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- user, subscription, notification
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AI prompt yönetimi
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Maç etiketleri
CREATE TABLE match_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id INTEGER NOT NULL,
  tag TEXT NOT NULL, -- 'featured', 'big_match', 'derby'
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_id, tag)
);
```

### Yeni Edge Functions

| Function | Amaç |
|----------|------|
| `admin-users` | Kullanıcı CRUD işlemleri |
| `admin-subscriptions` | Premium yönetimi |
| `admin-stats` | İstatistik API'leri |
| `admin-notifications` | Bildirim gönderme |
| `admin-prompts` | AI prompt yönetimi |
| `register-push-token` | FCM token kaydetme (mobil) |

### Frontend Yapısı (Admin Panel)

```text
src/
├── pages/
│   └── Admin.tsx (mevcut - genişletilecek)
│
├── components/
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── AdminSidebar.tsx
│       ├── DashboardStats.tsx
│       ├── UserManagement/
│       │   ├── UserTable.tsx
│       │   ├── UserDetailModal.tsx
│       │   └── AssignPremiumModal.tsx
│       ├── PremiumManagement/
│       │   ├── SubscriptionTable.tsx
│       │   └── ManualSubscriptionForm.tsx
│       ├── AIManagement/
│       │   ├── PredictionStats.tsx
│       │   ├── PromptEditor.tsx
│       │   └── PredictionReview.tsx
│       ├── MatchManagement/
│       │   ├── MatchTable.tsx
│       │   └── TagManager.tsx
│       ├── Notifications/
│       │   ├── NotificationForm.tsx
│       │   ├── NotificationHistory.tsx
│       │   └── AudienceSelector.tsx
│       ├── Statistics/
│       │   ├── UsageCharts.tsx
│       │   ├── ConversionStats.tsx
│       │   └── AIAccuracyChart.tsx
│       └── ActivityLog/
│           └── AdminLogTable.tsx
│
└── hooks/
    └── admin/
        ├── useAdminUsers.ts
        ├── useAdminStats.ts
        ├── useAdminSubscriptions.ts
        └── useAdminNotifications.ts
```

---

## Push Bildirim Altyapısı

### Android Tarafı (Capacitor)
1. Firebase Cloud Messaging (FCM) entegrasyonu
2. `@capacitor/push-notifications` paketi
3. Token kaydetme (login sonrası)
4. Deep link desteği

### Backend Tarafı
1. FCM Admin SDK ile bildirim gönderme
2. Toplu gönderim desteği
3. Zamanlı gönderim (scheduled)
4. Teslim/açılma takibi

---

## Güvenlik Önlemleri

| Önlem | Uygulama |
|-------|----------|
| Rol kontrolü | Tüm admin edge functions `admin` rolü gerektirir |
| RLS politikaları | Admin tabloları için özel politikalar |
| Aktivite logu | Her admin işlemi kaydedilir |
| Rate limiting | API çağrıları sınırlandırılır |
| JWT doğrulama | Tüm isteklerde auth kontrolü |

---

## Uygulama Aşamaları

### Aşama 1: Temel Altyapı
- Yeni veritabanı tabloları
- RLS politikaları
- Admin layout bileşeni
- Dashboard istatistikleri

### Aşama 2: Kullanıcı Yönetimi
- Kullanıcı listesi
- Rol yönetimi
- Premium atama
- Askıya alma

### Aşama 3: AI & İçerik
- Prompt yönetimi
- Tahmin istatistikleri
- Maç etiketleme

### Aşama 4: Push Bildirimleri
- FCM entegrasyonu (Android)
- Token yönetimi
- Bildirim gönderme arayüzü

### Aşama 5: Raporlama
- Detaylı grafikler
- Dışa aktarma
- Otomatik raporlar

---

## Değiştirilecek Dosyalar

| Dosya | İşlem |
|-------|-------|
| `src/pages/Admin.tsx` | Tamamen yeniden yazılacak |
| `src/components/admin/*` | Yeni bileşenler |
| `src/hooks/admin/*` | Yeni hook'lar |
| `supabase/functions/admin-*` | 5 yeni edge function |
| `supabase/migrations/` | Yeni tablolar |
| `android/app/build.gradle` | FCM bağımlılıkları |

---

## Beklenen Sonuç

| Metrik | Önceki | Sonraki |
|--------|--------|---------|
| Admin özellikleri | Sadece cron izleme | Tam yönetim paneli |
| Kullanıcı yönetimi | Manuel SQL | Arayüz üzerinden |
| Premium atama | Manuel SQL | Tek tıkla atama |
| Push bildirim | YOK | Tam destek |
| İstatistik görselleştirme | YOK | Grafiklerle |
| Admin aktivite takibi | YOK | Detaylı log |

