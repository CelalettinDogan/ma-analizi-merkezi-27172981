

# Fix: `planIdentifier cannot be empty` Hatası

## Sorun
`@capgo/native-purchases` eklentisi Android abonelik satın almalarında `planIdentifier` parametresi bekliyor. Şu an bu parametre gönderilmiyor.

## Çözüm

### `src/services/purchaseService.ts`

1. Base Plan ID mapping'i ekle (PRODUCTS sabitlerinin altına):

```typescript
const BASE_PLAN_IDS: Record<string, string> = {
  premium_basic_monthly: 'basic-monthly',
  premium_basic_yearly: 'basic-yearly',
  premium_plus_monthly: 'plus-monthly',
  premium_plus_yearly: 'plus-yearly',
  premium_pro_monthly: 'pro-monthly',
  premium_pro_yearly: 'pro-yearly',
};
```

2. `purchaseSubscription` metodundaki `purchaseProduct` çağrısına `planIdentifier` ekle (satır 140-143):

```typescript
const transaction = await NativePurchases.purchaseProduct({
  productIdentifier: productId,
  planIdentifier: BASE_PLAN_IDS[productId] || '',
  productType: PURCHASE_TYPE.SUBS,
  quantity: 1,
});
```

### Değişecek dosya
- `src/services/purchaseService.ts` — tek dosya, iki küçük ekleme

