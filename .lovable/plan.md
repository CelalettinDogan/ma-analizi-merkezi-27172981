
# Rol ve Paket Bazlı Erişim Sistemi Planı

## Mevcut Durum Analizi

**Mevcut Plan Tipleri:**
- `free` → Günlük 2 analiz, AI Chat: YOK
- `basic` → Günlük 10 analiz, AI Chat: YOK
- `pro` → Sınırsız analiz, AI Chat: 3/gün
- `ultra` → Sınırsız analiz, AI Chat: Sınırsız

**Mevcut Roller (user_roles tablosu):**
- `admin`, `moderator`, `user`, `vip`

**Sorunlar:**
1. Paket isimleri yeni gereksinimlerle uyuşmuyor (basic/pro/ultra → Premium Basic/Plus/Pro)
2. Free kullanıcı için AI Asistan erişimi net değil
3. Guest (giriş yapmamış) kullanıcı için ayrı akış yok
4. Chat limiti dolan Premium için BottomSheet yok
5. Admin için satın alma CTA'ları hala görünüyor olabilir

---

## Yeni Erişim Matrisi

| Kullanıcı | Maç Analizi | AI Asistan | Satın Al CTA | Store Butonları |
|-----------|-------------|------------|--------------|-----------------|
| Admin | ∞ | ∞ | HAYIR | HAYIR |
| Premium Pro | ∞ | 10/gün | HAYIR | HAYIR |
| Premium Plus | ∞ | 5/gün | HAYIR | HAYIR |
| Premium Basic | ∞ | 3/gün | HAYIR | HAYIR |
| Free | 2/gün | KAPALI | EVET | HAYIR |
| Guest | KAPALI | KAPALI | EVET | EVET |

---

## Dosya Değişiklikleri

### 1. `src/constants/accessLevels.ts` - Yeniden Yapılandır

**Değişiklikler:**
- Plan tiplerini güncelle: `free` | `premium_basic` | `premium_plus` | `premium_pro`
- Yeni chatbot limitleri: 3, 5, 10
- Tüm premium planlar için sınırsız analiz
- Helper fonksiyonlar ekle: `isGuestUser()`, `shouldShowPurchaseCTA()`

```typescript
export type PlanType = 'free' | 'premium_basic' | 'premium_plus' | 'premium_pro';

export const PLAN_ACCESS_LEVELS: Record<PlanType, AccessLevel> = {
  free: {
    dailyAnalysis: 2,
    aiChat: 0,  // Erişim yok
    historyDays: 7,
    advancedStats: 'partial',
    showAds: true,
    prioritySupport: false,
  },
  premium_basic: {
    dailyAnalysis: 999, // Sınırsız
    aiChat: 3,
    historyDays: 30,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: false,
  },
  premium_plus: {
    dailyAnalysis: 999,
    aiChat: 5,
    historyDays: 999,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: true,
  },
  premium_pro: {
    dailyAnalysis: 999,
    aiChat: 10,
    historyDays: 999,
    advancedStats: 'full',
    showAds: false,
    prioritySupport: true,
  },
};

// Yeni helper fonksiyonlar
export const shouldShowPurchaseCTA = (planType: PlanType, isAdmin: boolean): boolean => {
  if (isAdmin) return false;
  return planType === 'free';
};

export const shouldShowUpgradeCTA = (planType: PlanType, isAdmin: boolean): boolean => {
  if (isAdmin) return false;
  // Sadece limit dolan premium kullanıcılar için
  return planType !== 'premium_pro';
};
```

### 2. `src/hooks/usePremiumStatus.ts` - Plan Mapping Güncelle

**Değişiklikler:**
- `getPlanTypeFromSubscription` fonksiyonunu güncelle
- Yeni plan isimlerini map et

```typescript
const getPlanTypeFromSubscription = (subscription: PremiumSubscription | null): PlanType => {
  if (!subscription) return 'free';
  
  const planType = subscription.plan_type?.toLowerCase() || '';
  
  // Yeni plan mapping
  if (planType.includes('pro') || planType.includes('premium_pro')) return 'premium_pro';
  if (planType.includes('plus') || planType.includes('premium_plus')) return 'premium_plus';
  if (planType.includes('basic') || planType.includes('temel') || planType.includes('premium_basic')) return 'premium_basic';
  
  // Legacy fallback
  if (planType.includes('ultra')) return 'premium_pro';
  
  return 'premium_basic'; // Default premium
};
```

### 3. `src/hooks/useAccessLevel.ts` - Yeni Özellikler Ekle

**Değişiklikler:**
- `isGuest` durumu ekle (giriş yapmamış)
- `shouldShowPurchaseCTA` ekle
- `shouldShowUpgradeCTA` ekle
- `canAccessAnalysis` ekle

```typescript
interface UseAccessLevelReturn {
  // Mevcut alanlar...
  isGuest: boolean;
  shouldShowPurchaseCTA: boolean;
  shouldShowUpgradeCTA: boolean;
  canAccessAnalysis: boolean;
}

export const useAccessLevel = (): UseAccessLevelReturn => {
  const { user } = useAuth();
  const { planType, isPremium, isLoading: premiumLoading } = usePlatformPremium();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const isGuest = !user;
  
  const shouldShowPurchaseCTA = useMemo(() => {
    if (isGuest) return true; // Guest için store butonları göster
    if (isAdmin) return false;
    return !isPremium;
  }, [isGuest, isAdmin, isPremium]);

  const shouldShowUpgradeCTA = useMemo(() => {
    if (isAdmin) return false;
    if (isGuest) return false;
    return planType !== 'premium_pro';
  }, [isAdmin, isGuest, planType]);

  const canAccessAnalysis = useMemo(() => {
    if (isGuest) return false;
    return true; // Giriş yapmış herkes analiz yapabilir
  }, [isGuest]);

  // ...
};
```

### 4. Yeni Bileşen: `src/components/chat/ChatLimitSheet.tsx`

**Amaç:** Premium kullanıcının chatbot limiti dolduğunda gösterilecek BottomSheet

```typescript
// Yeni bileşen içeriği:
// - Başlık: "Günlük AI Asistan Hakkın Doldu"
// - Alt metin: "Limit yarın yenilenecek veya paketini yükseltebilirsin"
// - Geri sayım: Gece yarısına kadar kalan süre
// - CTA: "Paketi Yükselt" → Profil sayfasına yönlendir
// - İkincil CTA: "Yarın Tekrar Dene"
```

### 5. Yeni Bileşen: `src/components/chat/GuestGate.tsx`

**Amaç:** Guest (giriş yapmamış) kullanıcı için bilgilendirme ekranı

```typescript
// İçerik:
// - Başlık: "AI Asistan Mobil Uygulamada"
// - Alt metin: "Giriş yaparak AI Asistan'a erişebilirsin"
// - CTA 1: "Giriş Yap" → /auth
// - CTA 2: "Kayıt Ol" → /auth (signup mode)
// - STORE BUTONLARI GÖSTER (sadece guest için)
```

### 6. `src/pages/Chat.tsx` - Akış Güncellemesi

**Yeni Akış:**
```
1. authLoading → Loading spinner
2. !user (Guest) → GuestGate bileşeni
3. user + !hasAccess (Free) → PremiumGate bileşeni
4. user + hasAccess + !hasRemainingUsage → ChatLimitSheet (Premium limit dolu)
5. user + hasAccess + hasRemainingUsage → Chat arayüzü
```

**Değişiklikler:**
- `GuestGate` import et ve Guest kontrolü ekle
- `ChatLimitSheet` import et ve limit dolu kontrolü ekle
- Admin için hiçbir CTA gösterme
- Premium badge'leri güncelle (Basic/Plus/Pro)

### 7. `src/components/chat/PremiumGate.tsx` - İçerik Güncellemesi

**Değişiklikler:**
- Başlık: "AI Asistan Premium Kullanıcılara Özel"
- Paket karşılaştırma tablosu ekle
- Fiyatları güncelle
- "Uygulamayı İndir" CTA'sını KALDIR (mobil uygulama içindeyiz)

### 8. `src/components/premium/AnalysisLimitSheet.tsx` - Free Kullanıcı İçin

**Değişiklikler:**
- Premium avantajlarını vurgula
- Paket karşılaştırması göster
- Play Store uyumlu metinler koru

### 9. `src/components/navigation/BottomNav.tsx` - Badge Güncellemesi

**Değişiklikler:**
- Premium kullanıcı için AI Asistan badge'ini kaldır
- Sadece Free kullanıcı için premium badge göster
- Admin için hiç badge gösterme

```typescript
// Dinamik badge kontrolü
const showPremiumBadge = useMemo(() => {
  if (isAdmin) return false;
  if (isPremium) return false;
  return true; // Sadece Free için
}, [isAdmin, isPremium]);
```

### 10. Edge Function: `supabase/functions/ai-chatbot/index.ts`

**Değişiklikler:**
- Plan bazlı limit kontrolü güncelle
- VIP_DAILY_LIMIT yerine plan bazlı limitleri kullan
- Yeni hata mesajları

---

## Kullanıcı Akışları

### Admin Kullanıcı
```
AI Asistan'a tıkla → Direkt Chat açılır
- Hiç limit göstergesi yok
- Hiç satın alma CTA'sı yok
- Admin badge göster
```

### Premium Kullanıcı (Limit Dolu Değil)
```
AI Asistan'a tıkla → Chat açılır
- UsageMeter göster (3/3, 5/5, 10/10)
- Plan badge göster (Basic/Plus/Pro)
- Satın alma CTA'sı YOK
```

### Premium Kullanıcı (Limit Dolu)
```
AI Asistan'a tıkla → ChatLimitSheet açılır
- "Günlük AI Asistan Hakkın Doldu"
- Geri sayım göster
- "Paketi Yükselt" CTA
```

### Free Kullanıcı
```
AI Asistan'a tıkla → PremiumGate gösterilir
- "AI Asistan Premium Kullanıcılara Özel"
- Paket karşılaştırması
- "Premium'a Geç" CTA
```

### Guest (Giriş Yapmamış)
```
AI Asistan'a tıkla → GuestGate gösterilir
- "Giriş Yap veya Kayıt Ol"
- Play Store butonu (opsiyonel)
```

---

## Dosya Listesi

| Dosya | İşlem |
|-------|-------|
| `src/constants/accessLevels.ts` | Güncelle |
| `src/hooks/usePremiumStatus.ts` | Güncelle |
| `src/hooks/useAccessLevel.ts` | Güncelle |
| `src/components/chat/ChatLimitSheet.tsx` | **Yeni** |
| `src/components/chat/GuestGate.tsx` | **Yeni** |
| `src/pages/Chat.tsx` | Güncelle |
| `src/components/chat/PremiumGate.tsx` | Güncelle |
| `src/components/navigation/BottomNav.tsx` | Güncelle |
| `supabase/functions/ai-chatbot/index.ts` | Güncelle |

---

## Teknik Detaylar

### Plan Tipi Mapping (Database → Frontend)

```
Database plan_type         → Frontend PlanType
─────────────────────────────────────────────
"basic", "temel"           → "premium_basic"
"plus", "orta"             → "premium_plus"  
"pro", "premium"           → "premium_pro"
(null veya yok)            → "free"
```

### Chatbot Limit Kontrolü (Edge Function)

```typescript
const PLAN_CHAT_LIMITS = {
  premium_basic: 3,
  premium_plus: 5,
  premium_pro: 10,
  free: 0, // Erişim yok
};

// Admin her zaman sınırsız
if (isAdmin) {
  // Limit kontrolü yapma
}

// Free kullanıcı erişemez
if (planType === 'free') {
  return error('ACCESS_DENIED');
}

// Premium limit kontrolü
if (currentUsage >= PLAN_CHAT_LIMITS[planType]) {
  return error('LIMIT_EXCEEDED');
}
```

### CTA Görünürlük Kuralları

```typescript
// Satın alma CTA (Premium'a Geç)
showPurchaseCTA = !isAdmin && !isPremium;

// Yükseltme CTA (Paketi Yükselt)
showUpgradeCTA = !isAdmin && isPremium && planType !== 'premium_pro';

// Store butonları
showStoreButtons = isGuest; // Sadece guest için

// "Uygulamayı İndir"
showAppDownload = false; // ASLA (mobil uygulamadayız)
```
