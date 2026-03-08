

# Google Play Satın Alma Akışı — Debug ve Düzeltme Planı

## Tespit Edilen Sorunlar

### Sorun 1: Acknowledge Endpoint MEVCUT DEĞİL (KRİTİK)

**Dosya:** `supabase/functions/verify-purchase/index.ts` satır 136

Önceki düzeltmede acknowledge endpoint'i yanlış bir v2 URL'ye değiştirilmiş:
```
/purchases/subscriptionsv2/tokens/${purchaseToken}:acknowledge
```
Bu endpoint **Google Play API'de mevcut değil**. v2 API'de sadece `get` ve `revoke` var, acknowledge yok. Doğru endpoint v1:
```
/purchases/subscriptions/{subscriptionId}/tokens/{token}:acknowledge
```
Google'ın Mayıs 2025 güncellemesiyle `subscriptionId` artık opsiyonel, yani boş string gönderilebilir.

**Sonuç:** Acknowledge başarısız oluyor → 3 gün sonra Google satın almayı otomatik iptal eder.

**Düzeltme:** Acknowledge fonksiyonunu v1 endpoint'e geri çevir, `subscriptionId` opsiyonel olarak geç:
```typescript
const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/-/tokens/${purchaseToken}:acknowledge`;
```

### Sorun 2: Upsert `onConflict: "order_id"` Partial Index ile Çalışmıyor (YÜKSEK)

**Dosya:** `supabase/functions/verify-purchase/index.ts` satır 280-300

DB'deki `order_id` unique index'i **partial**: `WHERE (order_id IS NOT NULL)`. PostgREST, partial unique index'leri upsert conflict target olarak tanımaz. Bu nedenle upsert **her zaman hata verir** ve fallback insert'e düşer.

Fallback insert çalışır, ancak sorun şu: önce `deactivate` adımı (satır 269-273) tüm aktif kayıtları kapatıyor, sonra upsert başarısız, sonra fallback insert çalışıyor. Bu path her seferinde error log oluşturur ve gereksiz karmaşıklık.

**Düzeltme:** Upsert yerine doğrudan insert kullan. Zaten her satın almada eski kayıtlar deaktive ediliyor:
```typescript
// Upsert kaldır, doğrudan insert yap
const { data: subscriptionData, error: insertError } = await supabaseAdmin
  .from("premium_subscriptions")
  .insert({
    user_id: user.id,
    plan_type: planType,
    platform,
    purchase_token: purchaseToken,
    order_id: subscription.latestOrderId || orderId,
    product_id: resolvedProductId,
    starts_at: startTime.toISOString(),
    expires_at: expiryTime.toISOString(),
    is_active: true,
    auto_renewing: autoRenewing,
    purchase_state: 0,
    acknowledged: true,
  })
  .select()
  .single();
```

### Sorun 3: `purchaseToken` Null Olabilir (@capgo/native-purchases)  (ORTA)

**Dosya:** `src/services/purchaseService.ts` satır 149-156

`NativePurchases.purchaseProduct()` dönen `transaction` objesinin yapısı:
```typescript
const transaction = await NativePurchases.purchaseProduct({...});
```
Capgo dokümantasyonuna göre Android'de `purchaseToken` ve `transactionId` ikisi de mevcut. Mevcut kod `transaction?.purchaseToken || transaction?.transactionId` ile doğru fallback yapıyor. Ancak `purchaseProduct` dönen obje doğrudan `Transaction` mı yoksa sarmalayıcı bir obje mi bunu doğrulamak için ek log eklemek faydalı olacak.

**Düzeltme:** Satın alma sonrası detaylı log ekle:
```typescript
console.log('PurchaseService: transaction result', JSON.stringify(transaction));
```

### Sorun 4: Satın Alma Hatası Kullanıcıya Yeterince Net İletilmiyor (DÜŞÜK)

`handlePurchase` fonksiyonlarında (PremiumUpgrade, Premium.tsx), Google Play ödeme başarılı olsa bile verify-purchase hata dönerse kullanıcıya "Satın alma başarısız" toast gösteriliyor. Kullanıcı "ödeme alındı ama premium olmadım" diye düşünüyor çünkü Google Play tarafı başarılı, ama backend verification başarısız.

**Düzeltme:** Hata mesajını daha spesifik yap: "Ödemeniz alındı ancak aktivasyon başarısız oldu. 'Satın Almaları Geri Yükle' ile tekrar deneyin."

## Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `supabase/functions/verify-purchase/index.ts` | Acknowledge'ı v1 endpoint'e düzelt (subscriptionId opsiyonel), upsert→insert değiştir |
| `src/services/purchaseService.ts` | Detaylı transaction logging ekle |
| `src/components/premium/PremiumUpgrade.tsx` | Verification hata mesajını iyileştir |
| `src/pages/Premium.tsx` | Verification hata mesajını iyileştir |

## Akış Özeti

Mevcut durumda verify-purchase fonksiyonu **deploy edilmiş ve çalışıyor** (test ettik, 400 döndü — beklenen davranış). Ancak:
1. Acknowledge yanlış endpoint kullanıyor → 3 gün sonra Google iptal eder
2. Upsert her seferinde hata veriyor, fallback insert'e düşüyor → bu path çalışıyorsa DB'ye kayıt yazılıyor olmalı
3. Edge function loglarında hiç kayıt yok → kullanıcı henüz bu kod versiyonuyla gerçek satın alma denememiş olabilir

En kritik düzeltme **acknowledge endpoint**'dir — bu düzeltilmezse kullanıcının satın alması 3 gün sonra otomatik iptal edilir.

