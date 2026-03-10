

## Problem

Edge function loglarında açıkça görülüyor:

```
premium_subscriptions_plan_type_check constraint violation
```

**`premium_subscriptions`** tablosundaki `plan_type` sütununda bir CHECK constraint var ve sadece şu değerlere izin veriyor: `'monthly'`, `'yearly'`, `'trial'`.

Ancak `verify-purchase` edge function'ı `'premium_basic'`, `'premium_plus'`, `'premium_pro'` gibi değerler eklemeye çalışıyor. Bu yüzden Google Play ödemeyi alıyor ama veritabanına kayıt yapılamıyor ve "aktivasyon başarısız" hatası dönüyor.

## Çözüm

Veritabanındaki CHECK constraint'i güncelleyerek yeni plan tiplerini kabul etmesini sağlamak:

1. **Database migration**: Eski constraint'i kaldır, yenisini ekle:
   - İzin verilen değerler: `'monthly'`, `'yearly'`, `'trial'`, `'premium_basic'`, `'premium_plus'`, `'premium_pro'`
   - Default değeri `'monthly'` yerine `'free'` olarak da güncellenebilir veya olduğu gibi bırakılabilir

2. **Mevcut başarısız satın almaları düzeltme**: Kullanıcının mevcut satın alımları Google Play tarafında zaten onaylanmış durumda. Constraint düzeltildikten sonra uygulamadan "Restore Purchases" ile tekrar doğrulama yapılabilir.

### Tek değişiklik
- Bir SQL migration ile `premium_subscriptions_plan_type_check` constraint'ini güncellemek. Kod değişikliği gerekmez.

