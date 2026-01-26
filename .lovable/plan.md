
# Android-Only Dönüşüm Planı

Bu proje artık **sadece Android mobil uygulaması** olarak çalışacak. Tüm web akışları, masaüstü kontrolleri ve platform ayrımları kaldırılacak.

---

## Dönüşüm Kapsamı

### A. Kaldırılacak Bileşenler (Tamamen Silinecek)

| Dosya | Açıklama |
|-------|----------|
| `src/components/chat/WebPremiumGate.tsx` | Web kullanıcıları için chat engelleyici |
| `src/components/premium/WebLimitSheet.tsx` | Web analiz limiti drawer'ı |
| `src/components/promotion/AppDownloadBanner.tsx` | Masaüstü uygulama indirme banner'ı |
| `src/hooks/usePlatformPromotion.ts` | Desktop/mobile promosyon stratejisi |

### B. Sadeleştirilecek Hook'lar

**1. `src/hooks/usePlatform.ts`**
- Web kontrollerini kaldır
- Varsayılan olarak Android kabul et
- `isWeb`, `isIOS` alanlarını kaldır veya her zaman `false` döndür

**Önceki:**
```typescript
return {
  platform: 'web',
  isNative: false,
  isAndroid: false,
  isIOS: false,
  isWeb: true,
};
```

**Yeni:**
```typescript
return {
  platform: 'android',
  isNative: true,
  isAndroid: true,
};
```

**2. `src/hooks/usePlatformPremium.ts`**
- `isWebPlatform`, `canBePremium` kontrollerini kaldır
- Doğrudan premium durumunu döndür
- `WEB_DAILY_ANALYSIS_LIMIT` sabitini kaldır
- `STORE_LINKS` sadece Play Store'u içersin

**Önceki:**
```typescript
const isPremium = useMemo(() => {
  if (isWeb) return false; // Web users are NEVER premium
  return premiumStatus.isPremium;
}, [isWeb, premiumStatus.isPremium]);
```

**Yeni:**
```typescript
const isPremium = premiumStatus.isPremium;
```

**3. `src/constants/accessLevels.ts`**
- `WEB_ACCESS_LEVEL` sabitini kaldır
- `PlatformType`'dan `'web'` seçeneğini kaldır
- `getAccessLevel` fonksiyonundan `isWebPlatform` parametresini kaldır
- `canAccessAIChat`, `hasUnlimitedAnalysis` fonksiyonlarını sadeleştir

**4. `src/hooks/useAccessLevel.ts`**
- `isWebPlatform` kontrollerini kaldır
- Doğrudan plan bazlı erişim döndür

**5. `src/hooks/useAnalysisLimit.ts`**
- `WEB_ACCESS_LEVEL` import'unu kaldır
- `isWebPlatform` ve `showAppDownloadPrompt` alanlarını kaldır

### C. Güncellenecek Sayfalar

**1. `src/pages/Index.tsx`**
- `WebLimitSheet` ve `AppDownloadBanner` import/kullanımlarını kaldır
- `usePlatformPromotion` hook'unu kaldır
- `isWebPlatform`, `isDesktop` kontrollerini kaldır
- `webLimitSheet` kullanımını kaldır

**Kaldırılacak kodlar:**
```typescript
// Kaldır
import WebLimitSheet, { useWebLimitSheet } from '@/components/premium/WebLimitSheet';
import AppDownloadBanner from '@/components/promotion/AppDownloadBanner';
import { usePlatformPromotion } from '@/hooks/usePlatformPromotion';

// Kaldır
const { isDesktop, showAppDownload, dismissAppDownload } = usePlatformPromotion();
const webLimitSheet = useWebLimitSheet();

// Kaldır
{isWebPlatform && (
  <WebLimitSheet ... />
)}
{isDesktop && (
  <AppDownloadBanner ... />
)}
```

**2. `src/pages/Chat.tsx`**
- `WebPremiumGate` import/kullanımını kaldır
- `isWeb` kontrolünü kaldır

**Kaldırılacak kod:**
```typescript
// Kaldır
import WebPremiumGate from '@/components/chat/WebPremiumGate';

// Kaldır
if (isWeb) {
  return <WebPremiumGate onClose={() => navigate(-1)} variant="chatbot" />;
}
```

**3. `src/components/premium/PurchaseButton.tsx`**
- Web için Play Store yönlendirme kodunu kaldır
- Sadece native satın alma akışı kalsın

**4. `src/components/premium/PremiumPromotionModal.tsx`**
- `isDesktop` kontrollerini kaldır
- Masaüstü için özel mesajları kaldır

### D. Export Temizliği

**`src/components/premium/index.ts`**
- `WebLimitSheet` export'unu kaldır

---

## Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|-------|-------|
| `src/components/chat/WebPremiumGate.tsx` | SİL |
| `src/components/premium/WebLimitSheet.tsx` | SİL |
| `src/components/promotion/AppDownloadBanner.tsx` | SİL |
| `src/hooks/usePlatformPromotion.ts` | SİL |
| `src/hooks/usePlatform.ts` | Sadeleştir (Android-first) |
| `src/hooks/usePlatformPremium.ts` | Sadeleştir (Web kontrollerini kaldır) |
| `src/constants/accessLevels.ts` | `WEB_ACCESS_LEVEL` kaldır |
| `src/hooks/useAccessLevel.ts` | `isWebPlatform` kaldır |
| `src/hooks/useAnalysisLimit.ts` | Web kontrollerini kaldır |
| `src/pages/Index.tsx` | Web bileşenlerini kaldır |
| `src/pages/Chat.tsx` | `WebPremiumGate` kaldır |
| `src/components/premium/PurchaseButton.tsx` | Web akışını kaldır |
| `src/components/premium/PremiumPromotionModal.tsx` | Desktop kontrollerini kaldır |
| `src/components/premium/index.ts` | Export temizliği |

---

## Teknik Detaylar

### Yeni `usePlatform.ts` Yapısı

```typescript
import { Capacitor } from '@capacitor/core';

interface UsePlatformReturn {
  platform: 'android';
  isNative: boolean;
  isAndroid: boolean;
}

export const usePlatform = (): UsePlatformReturn => {
  // Bu uygulama sadece Android'de çalışır
  // Capacitor her zaman native olarak algılanacak
  const isNative = Capacitor.isNativePlatform();
  
  return {
    platform: 'android',
    isNative: isNative || true, // Fallback true
    isAndroid: true,
  };
};
```

### Yeni `accessLevels.ts` Yapısı

```typescript
export type PlanType = 'free' | 'basic' | 'pro' | 'ultra';

// Web sabiti KALDIRILDI
// WEB_ACCESS_LEVEL KALDIRILDI

export const getAccessLevel = (
  planType: PlanType,
  isAdmin: boolean = false
): AccessLevel => {
  if (isAdmin) return ADMIN_ACCESS_LEVEL;
  return PLAN_ACCESS_LEVELS[planType];
};

export const canAccessAIChat = (
  planType: PlanType,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  return planType === 'pro' || planType === 'ultra';
};

export const hasUnlimitedAnalysis = (
  planType: PlanType,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  return planType === 'pro' || planType === 'ultra';
};
```

---

## Sonuç

Bu dönüşüm sonrasında:
- Tüm web-specific kodlar kaldırılmış olacak
- Platform kontrolü sadeleşecek (her zaman Android)
- Kod tabanı ~300 satır küçülecek
- Play Store odaklı, native-first bir yapı oluşacak
- Daha hızlı ve temiz bir codebase
