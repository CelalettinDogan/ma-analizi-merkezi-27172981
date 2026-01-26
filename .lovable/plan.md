
# Premium Satın Alma Akışı Güncelleme Planı

## Tespit Edilen Sorunlar

| Dosya | Sorun | Öncelik |
|-------|-------|---------|
| `purchaseService.ts` | Product ID'ler yeni plan tiplerine uygun değil | Yüksek |
| `verify-purchase/index.ts` | Plan mapping sadece monthly/yearly döndürüyor | Yüksek |
| `PremiumUpgrade.tsx` | Sadece 2 plan gösteriyor, web kontrolleri var | Orta |
| `PurchaseButton.tsx` | Plan tipi bilgisi eksik, toast mesajları generic | Düşük |

---

## Yapılacak Değişiklikler

### 1. `src/services/purchaseService.ts` - Product ID'leri Güncelle

**Mevcut:**
```typescript
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
} as const;
```

**Yeni:**
```typescript
export const PRODUCTS = {
  // Basic Plan
  PREMIUM_BASIC_MONTHLY: 'premium_basic_monthly',
  PREMIUM_BASIC_YEARLY: 'premium_basic_yearly',
  // Plus Plan
  PREMIUM_PLUS_MONTHLY: 'premium_plus_monthly',
  PREMIUM_PLUS_YEARLY: 'premium_plus_yearly',
  // Pro Plan
  PREMIUM_PRO_MONTHLY: 'premium_pro_monthly',
  PREMIUM_PRO_YEARLY: 'premium_pro_yearly',
} as const;

// Plan bilgileri - accessLevels'tan fiyatlar alınacak
export const PLAN_PRODUCTS = {
  premium_basic: {
    monthly: PRODUCTS.PREMIUM_BASIC_MONTHLY,
    yearly: PRODUCTS.PREMIUM_BASIC_YEARLY,
    name: 'Premium Basic',
    chatLimit: 3,
  },
  premium_plus: {
    monthly: PRODUCTS.PREMIUM_PLUS_MONTHLY,
    yearly: PRODUCTS.PREMIUM_PLUS_YEARLY,
    name: 'Premium Plus',
    chatLimit: 5,
  },
  premium_pro: {
    monthly: PRODUCTS.PREMIUM_PRO_MONTHLY,
    yearly: PRODUCTS.PREMIUM_PRO_YEARLY,
    name: 'Premium Pro',
    chatLimit: 10,
  },
} as const;
```

**`getProducts()` Güncelleme:**
```typescript
async getProducts(): Promise<ProductInfo[]> {
  // accessLevels'tan fiyatları al
  return [
    // Basic
    {
      productId: PRODUCTS.PREMIUM_BASIC_MONTHLY,
      title: 'Premium Basic Aylık',
      description: 'Sınırsız analiz + 3 AI mesajı/gün',
      price: `₺${PLAN_PRICES.premium_basic.monthly}/ay`,
      priceAmount: PLAN_PRICES.premium_basic.monthly,
      currency: 'TRY',
      planType: 'premium_basic',
      period: 'monthly',
    },
    {
      productId: PRODUCTS.PREMIUM_BASIC_YEARLY,
      title: 'Premium Basic Yıllık',
      description: 'Sınırsız analiz + 3 AI mesajı/gün (2 ay bedava)',
      price: `₺${PLAN_PRICES.premium_basic.yearly}/yıl`,
      priceAmount: PLAN_PRICES.premium_basic.yearly,
      currency: 'TRY',
      planType: 'premium_basic',
      period: 'yearly',
    },
    // Plus & Pro için aynı yapı...
  ];
}
```

---

### 2. `supabase/functions/verify-purchase/index.ts` - Plan Mapping Düzelt

**Mevcut:**
```typescript
function getPlanType(productId: string): string {
  const planMap: Record<string, string> = {
    premium_monthly: "monthly",
    premium_yearly: "yearly",
  };
  return planMap[productId] || "monthly";
}
```

**Yeni:**
```typescript
function getPlanType(productId: string): string {
  // Product ID'den plan tipini çıkar
  // premium_basic_monthly -> premium_basic
  // premium_plus_yearly -> premium_plus
  // premium_pro_monthly -> premium_pro
  
  if (productId.includes('premium_pro')) return 'premium_pro';
  if (productId.includes('premium_plus')) return 'premium_plus';
  if (productId.includes('premium_basic')) return 'premium_basic';
  
  // Legacy fallback
  if (productId.includes('pro') || productId.includes('ultra')) return 'premium_pro';
  if (productId.includes('plus')) return 'premium_plus';
  
  return 'premium_basic'; // Default
}
```

---

### 3. `src/components/premium/PremiumUpgrade.tsx` - Yeniden Tasarla

**Değişiklikler:**
- 3 Premium plan göster (Basic, Plus, Pro)
- Her plan için aylık/yıllık seçim
- Web kontrollerini kaldır (Android-only)
- `accessLevels.ts`'den fiyatları kullan

**Yeni Yapı:**
```typescript
// Plans
const plans = [
  {
    id: 'premium_basic',
    name: 'Basic',
    monthlyId: PRODUCTS.PREMIUM_BASIC_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_BASIC_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_basic.monthly,
    yearlyPrice: PLAN_PRICES.premium_basic.yearly,
    chatLimit: 3,
    popular: false,
  },
  {
    id: 'premium_plus',
    name: 'Plus',
    monthlyId: PRODUCTS.PREMIUM_PLUS_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PLUS_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_plus.monthly,
    yearlyPrice: PLAN_PRICES.premium_plus.yearly,
    chatLimit: 5,
    popular: true, // En çok tercih edilen
  },
  {
    id: 'premium_pro',
    name: 'Pro',
    monthlyId: PRODUCTS.PREMIUM_PRO_MONTHLY,
    yearlyId: PRODUCTS.PREMIUM_PRO_YEARLY,
    monthlyPrice: PLAN_PRICES.premium_pro.monthly,
    yearlyPrice: PLAN_PRICES.premium_pro.yearly,
    chatLimit: 10,
    popular: false,
  },
];

// State
const [selectedPlan, setSelectedPlan] = useState('premium_plus');
const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
```

**UI Güncellemeleri:**
- Toggle: Aylık / Yıllık (2 ay bedava etiketi)
- Plan kartları: Basic, Plus (Popüler badge), Pro
- Her kart: Fiyat, AI mesaj limiti, özellikler
- CTA: "Satın Al" (sadece native)
- Web platform badge'ini kaldır

---

### 4. `src/components/premium/PurchaseButton.tsx` - Plan Bilgisi Ekle

**Yeni Props:**
```typescript
interface PurchaseButtonProps {
  productId: string;
  price: string;
  planName?: string; // "Premium Basic", "Premium Plus", "Premium Pro"
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

**Toast Mesajları:**
```typescript
// Başarılı
toast.success(`${planName || 'Premium'} üyeliğin aktif!`);

// Buton metni (web kontrolü kaldır)
<Crown className="h-4 w-4" />
{planName || 'Premium'} - {price}
```

---

## Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|-------|-------|
| `src/services/purchaseService.ts` | Product ID'leri ve plan bilgilerini güncelle |
| `supabase/functions/verify-purchase/index.ts` | Plan mapping fonksiyonunu düzelt |
| `src/components/premium/PremiumUpgrade.tsx` | 3 plan göster, web kontrollerini kaldır |
| `src/components/premium/PurchaseButton.tsx` | Plan ismi prop'u ekle |

---

## Yeni Satın Alma Akışı

```text
1. Kullanıcı Premium'a Yükselt sayfasını açar
2. 3 plan görür: Basic (₺49), Plus (₺79), Pro (₺99)
3. Aylık/Yıllık toggle ile periyot seçer
4. Plan kartına tıklar
5. "Satın Al" butonuna basar
6. Google Play satın alma akışı başlar
7. Başarılı ise verify-purchase çağrılır
8. Backend planı kaydeder (premium_basic/plus/pro)
9. Kullanıcı Premium statüsüne geçer
```

---

## Teknik Detaylar

### Play Store Product ID Mapping

```text
Play Store Console'da Oluşturulacak Ürünler:
- premium_basic_monthly (₺49)
- premium_basic_yearly (₺399)
- premium_plus_monthly (₺79)
- premium_plus_yearly (₺649)
- premium_pro_monthly (₺99)
- premium_pro_yearly (₺799)
```

### Database'e Kaydedilecek Plan Tipleri

```text
premium_subscriptions.plan_type:
- "premium_basic"
- "premium_plus"
- "premium_pro"
```

### ProductInfo Interface Güncellemesi

```typescript
export interface ProductInfo {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  planType: PlanType; // Yeni
  period: 'monthly' | 'yearly'; // Yeni
}
```
