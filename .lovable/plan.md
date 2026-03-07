

# Premium Abonelik Sistemi — Uçtan Uca Analiz Raporu

## Genel Akış

```text
Kullanıcı → Play Store satın alma → purchaseToken alınır
  → verify-purchase Edge Function → Google Play v2 API doğrulama
  → premium_subscriptions tablosuna upsert → frontend refetch()
  → usePremiumStatus → isPremium=true → özellikler açılır
  
İptal/süre dolumu → play-store-webhook → DB güncelleme
  → is_active=false veya expires_at geçmiş → usePremiumStatus → isPremium=false
```

---

## Bileşen Bazlı Analiz

### 1. Satın Alma ve Doğrulama — SORUNSUZ

| Adım | Durum | Açıklama |
|------|-------|----------|
| Native purchase | ✅ | `purchaseService.purchaseSubscription()` — `planIdentifier` düzeltildi |
| Token doğrulama | ✅ | `verify-purchase` v2 API kullanıyor |
| DB kayıt | ✅ | `upsert` + fallback `insert` mekanizması var |
| Acknowledge | ✅ | Pending ise otomatik acknowledge yapılıyor |
| plan_type mapping | ✅ | productId'den doğru plan_type çıkarılıyor |

### 2. Frontend Premium Kontrolü — SORUNSUZ

| Bileşen | Kontrol |
|---------|---------|
| `usePremiumStatus` | `is_active=true AND expires_at >= now()` sorgusu — doğru |
| `usePlatformPremium` | `usePremiumStatus` üzerine wrapper |
| `useAccessLevel` | `planType` + `isAdmin` ile tüm erişim kararları |
| localStorage cache | Premium sub cache + nav cache — hızlı ilk render |

### 3. Webhook ile Durum Güncelleme — SORUNSUZ

| Senaryo | Webhook Davranışı |
|---------|-------------------|
| İptal (süre bitmeden) | `is_active = expiryTime > now` — doğru, süre bitene kadar premium devam |
| Süre dolumu | `is_active = false` — doğru |
| Yenileme | `is_active = true`, yeni `expires_at` — doğru |
| Askıya alma / Duraklatma | `is_active = false` — doğru |

### 4. Süre Yönetimi — SORUNSUZ

- `expiryTime` Google Play v2 API'den `lineItems[0].expiryTime` olarak alınıyor
- Frontend `expires_at >= new Date().toISOString()` ile kontrol ediyor
- `daysRemaining` hesaplanıyor ve kullanıcıya gösteriliyor

---

## TESPİT EDİLEN SORUNLAR

### Sorun 1: `PremiumUpgrade` bileşeni satın alma sonrası `refetch()` çağırmıyor (ORTA)

`src/pages/Premium.tsx` satır 84'te `refetch()` çağrılıyor — doğru.

Ancak `src/components/premium/PremiumUpgrade.tsx` satır 92-94'te sadece `onClose?.()` çağrılıyor, **`refetch()` çağrılmıyor**. Bu bileşen Index sayfasından açılan onboarding/modal akışında kullanılıyorsa, satın alma sonrası kullanıcı hâlâ "free" görünür çünkü premium durumu yeniden sorgulanmaz.

**Düzeltme:** `PremiumUpgrade` bileşenine `usePlatformPremium` hook'undan `refetch` alıp başarılı satın alma sonrası çağırmak.

### Sorun 2: `PurchaseButton` bileşeni satın alma sonrası `refetch()` çağırmıyor (ORTA)

`src/components/premium/PurchaseButton.tsx` — `onSuccess` callback'i var ama bunu çağıran sayfanın `refetch()` yapıp yapmadığı garanti değil.

**Düzeltme:** `PurchaseButton` içinde de `usePlatformPremium().refetch()` çağrısı eklemek veya `onSuccess` callback'inin refetch'i garanti ettiğinden emin olmak.

### Sorun 3: Restore sonrası `refetch()` yok (DÜŞÜK)

`Premium.tsx` satır 95-103 — restore başarılı olunca toast gösteriyor ama `refetch()` çağırmıyor. Kullanıcı restore yaptıktan sonra premium görünmez.

**Düzeltme:** `handleRestore` içinde `if (r.success) { refetch(); toast.success(...); }` eklemek.

### Sorun 4: Birden fazla aktif abonelik riski (DÜŞÜK)

`upsert` `order_id` üzerinden çalışıyor. Ancak kullanıcı farklı bir plan satın alırsa (ör. basic→pro), farklı `order_id` ile yeni bir satır oluşur ve eski abonelik hâlâ `is_active=true` kalır. Frontend `maybeSingle()` ve `order('expires_at', desc).limit(1)` ile en son olanı alıyor — bu doğru çalışır. Ancak veritabanında birden fazla aktif kayıt birikebilir.

**Düzeltme:** `verify-purchase`'da yeni abonelik kaydedilmeden önce aynı kullanıcının eski aktif aboneliklerini `is_active=false` yapmak.

---

## Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/premium/PremiumUpgrade.tsx` | Satın alma sonrası `refetch()` ekleme |
| `src/pages/Premium.tsx` | Restore sonrası `refetch()` ekleme |
| `supabase/functions/verify-purchase/index.ts` | Yeni kayıt öncesi eski aktif abonelikleri deaktive etme |

### Sonuç

Temel akış (satın alma → doğrulama → DB → premium aktif → süre dolunca pasif) **mimari olarak doğru kurulmuş**. Ana risk, bazı UI bileşenlerinin başarılı satın alma sonrası `refetch()` çağırmaması — bu da kullanıcının uygulamayı kapatıp açmadan premium özelliklerini görememesine neden olur.

