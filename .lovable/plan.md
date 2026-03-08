

# Premium Satın Alma — Body Parsing Sorunu Düzeltme Planı

## Tespit

Edge function logu:
```
Verifying purchase: { userId: "6ced4f34-...", productId: undefined, platform: undefined, orderId: undefined }
```

`supabase.functions.invoke()` body'yi gönderirken ve edge function `req.json()` ile parse ederken bir uyumsuzluk var. Olası nedenler:

1. **`@supabase/supabase-js` v2.90+** bazı durumlarda body'yi sarmalayabilir (nested object)
2. **Native platform'da** `supabase.functions.invoke` farklı davranabilir
3. Edge function'da `req.json()` body'nin tamamını parse ediyor ama destructure edemiyorsa, muhtemelen body farklı bir yapıda geliyor

## Düzeltme Planı

### 1. Edge Function: Robust Body Parsing (`supabase/functions/verify-purchase/index.ts`)

`req.json()` sonucunu logla ve farklı body yapılarını destekle:

```typescript
const rawBody = await req.json();
console.log("Raw request body:", JSON.stringify(rawBody));

// Handle both direct and nested body structures
const body: PurchaseVerificationRequest = rawBody?.body || rawBody;
const { purchaseToken, productId, orderId, platform } = body;
```

Bu değişiklik `supabase.functions.invoke`'un body'yi `{ body: { ... } }` şeklinde sarmalama ihtimalini de karşılar.

### 2. Client: Ek Diagnostic Log (`src/services/purchaseService.ts`)

`verifyPurchase` fonksiyonunda gönderilen body'yi logla:

```typescript
const payload = { purchaseToken, productId, orderId, platform: 'android' };
console.log('PurchaseService: sending verify payload', JSON.stringify(payload));
```

### 3. Mevcut Ödeme Yapan Kullanıcılar

Kod düzeltmesi deploy edildikten sonra, ödeme yapan kullanıcılar uygulamada **"Satın Almaları Geri Yükle"** butonuna bastığında:
- `restorePurchases()` → `getPurchases()` → `verifyPurchase()` akışı çalışır
- Google Play'den mevcut aktif abonelik token'ı alınır
- Bu sefer body doğru gider → DB'ye yazılır → premium aktif olur

## Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `supabase/functions/verify-purchase/index.ts` | Raw body logging + nested body fallback |
| `src/services/purchaseService.ts` | Verify payload logging |

Küçük ama kritik değişiklik — tüm satın alma akışını düzeltir.

