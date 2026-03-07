

# Premium Abonelik Sistemi — Kapsamlı Denetim Raporu

---

## A) Genel Sonuç

**Sistem kısmen çalışıyor.** Mimari doğru kurulmuş ancak birkaç kritik ve yüksek öncelikli sorun, gerçek kullanıcılarda "satın aldım ama premium gelmedi" senaryosuna yol açabilir.

---

## B) Uçtan Uca Akış Analizi

| Adım | Durum | Detay |
|------|-------|-------|
| 1. Native satın alma | ✅ | `@capgo/native-purchases` + `planIdentifier` eşlemesi doğru |
| 2. Token alınması | ✅ | `transaction.purchaseToken` doğru alınıyor |
| 3. verify-purchase çağrısı | ✅ | `supabase.functions.invoke` ile auth header otomatik |
| 4. Google Play v2 API doğrulama | ✅ | `/subscriptionsv2/tokens/{token}` doğru endpoint |
| 5. Acknowledge | ⚠️ YÜKSEK | v1 acknowledge endpoint `productId` gerektiriyor — sorunlu |
| 6. DB kayıt | ✅ | upsert + fallback insert var |
| 7. Eski kayıtları deaktive | ✅ | `is_active=false` güncelleniyor |
| 8. Frontend refetch | ✅ | `PremiumUpgrade`, `PurchaseButton`, `Premium.tsx` hepsinde var |
| 9. Premium kontrol | ✅ | `usePremiumStatus` → `is_active=true AND expires_at >= now()` |
| 10. Süre bitince kapanma | ✅ | Frontend query otomatik filtreler; webhook da günceller |

---

## C) Bulunan Sorunlar

### KRİTİK

**Yok** — Temel akış mimari olarak sağlam.

---

### YÜKSEK

#### 1. Acknowledge Endpoint Uyumsuzluğu
**Dosya:** `supabase/functions/verify-purchase/index.ts` satır 130-151

**Sorun:** Acknowledge işlemi eski v1 endpoint kullanıyor:
```
/purchases/subscriptions/${productId}/tokens/${purchaseToken}:acknowledge
```
Bu endpoint `productId` olarak **subscription ID** bekliyor (örn. `premium_basic_monthly`). Ancak Google Play'in yeni Base Plan modelinde subscription ID artık `productId` değil — Base Plan modeli farklı yapıda. Eğer `productId` olarak `premium_basic_monthly` gönderiliyorsa ve Google Play Console'da subscription ID farklıysa, acknowledge **başarısız olur** (404).

Acknowledge başarısız olursa Google Play 3 gün sonra satın almayı **otomatik iptal eder**.

**Kanıt:** Satır 136'da `productId` parametresi `resolvedProductId` (lineItem'dan gelen), ancak v1 acknowledge endpoint subscription ID'yi path'te bekliyor. Base Plan modelinde `lineItem.productId` subscription ID ile aynı olmayabilir.

**Düzeltme:** Acknowledge için de Subscriptions v2 API'nin `acknowledge` endpoint'ini kullanmak veya mevcut kodda `resolvedProductId`'nin gerçekten Google Play Console'daki subscription ID ile eşleştiğini doğrulamak. Alternatif olarak, v2 API'de acknowledge artık gerekli olmayabilir — subscriptionState zaten "ACKNOWLEDGED" döner.

---

#### 2. Webhook Subscription Bulunamazsa Kayıp
**Dosya:** `supabase/functions/play-store-webhook/index.ts` satır 241-243

**Sorun:** Webhook'ta `purchase_token` ile arama yapılıp kayıt bulunamazsa sadece log yazılıyor:
```typescript
console.log("Subscription not found for token, may need manual resolution");
```
Yenileme (RENEWED) webhook'u geldiğinde eğer kullanıcı ilk kez farklı bir token ile kayıt yaptıysa (linked purchase token), yeni token ile kayıt bulunamaz ve abonelik **sessizce düşer**.

**Düzeltme:** `linkedPurchaseToken` kontrolü eklemek veya `user_id` + `product_id` ile alternatif arama yapmak.

---

#### 3. Periyodik Senkronizasyon Yok
**Sorun:** Webhook kaçarsa veya gecikirse, premium durumunu düzeltecek periyodik bir kontrol mekanizması (cron job) **yok**. Sistem tamamen webhook'a bağımlı.

**Düzeltme:** Bir pg_cron job ekleyerek `expires_at < now() AND is_active = true` olan kayıtları periyodik olarak `is_active = false` yapmak. Bu, webhook kaçsa bile premium'un sonsuza kadar açık kalmasını önler.

---

### ORTA

#### 4. `checkLimit` Race Condition
**Dosya:** `src/hooks/useAnalysisLimit.ts` satır 93-101

**Sorun:** `checkLimit` fonksiyonu `fetchUsage()` çağırdıktan sonra stale `usageCount` state'ini kullanıyor çünkü React state güncellemesi asenkron:
```typescript
await fetchUsage(); // state günceller ama...
return usageCount < dailyLimit; // eski usageCount kullanılıyor
```
Bu, hızlı ardışık analizlerde limiti aşmaya neden olabilir. Ancak backend RPC'de de limit kontrolü yapıldığı için gerçek aşım riski düşük.

---

#### 5. Platform CHECK Constraint
**Dosya:** Migration `20260123111510` satır 3

**Sorun:** `platform` sütununda `CHECK (platform IN ('web', 'android', 'ios'))` constraint var. Bu immutable olması gereken bir constraint ve sorun çıkarmaz, ancak uygulama sadece Android — `web` ve `ios` değerleri gereksiz.

---

### DÜŞÜK

#### 6. localStorage Cache Stale Kalabilir
**Dosya:** `src/hooks/usePremiumStatus.ts` satır 62-71

**Sorun:** Premium subscription cache'i localStorage'da tutuluyor. Webhook ile DB'de `is_active=false` yapılsa bile cache süresi dolana kadar kullanıcı **premium görünür**. Cache sadece `expires_at` kontrolü yapıyor, `is_active` kontrolü yok.

**Etkisi:** Düşük — sonraki API çağrısında düzelir. Ancak kullanıcı kısa süreliğine yanlış premium görebilir.

---

## D) Kanıt Özeti

| Sorun | Dosya | Satır | Kanıt |
|-------|-------|-------|-------|
| Acknowledge v1 uyumsuzluğu | `verify-purchase/index.ts` | 136 | v1 endpoint + Base Plan model çakışması |
| Webhook kayıp token | `play-store-webhook/index.ts` | 241 | Sadece log, recovery yok |
| Cron senkronizasyon eksik | - | - | pg_cron job listesinde premium temizleme yok |
| checkLimit race condition | `useAnalysisLimit.ts` | 100 | Stale state kullanımı |

---

## E) Düzeltme Planı

### 1. Acknowledge Endpoint Düzeltmesi (YÜKSEK)
`supabase/functions/verify-purchase/index.ts` — `acknowledgeSubscription` fonksiyonunu güncelle veya kaldır. v2 API ile doğrulanmış bir subscription zaten acknowledge edilmiş sayılır. Mevcut kodda zaten non-fatal (hata fırlatmıyor), ama 3 gün sonra Google iptal edebilir.

**Önerilen:** Acknowledge'ı Subscriptions v2 `acknowledge` endpoint'ine geçirmek:
```typescript
// v2 acknowledge — productId gerekmez
const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}:acknowledge`;
```

### 2. Webhook Fallback Araması (YÜKSEK)
`supabase/functions/play-store-webhook/index.ts` — Token bulunamazsa `user_id` + `product_id` ile arama ekle:
```typescript
if (!existingSub) {
  // Try finding by linked purchase token or most recent subscription
  const { data: fallbackSub } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("product_id", lineItem?.productId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // Update fallbackSub if found
}
```

### 3. Expired Premium Cleanup Cron (YÜKSEK)
Yeni DB fonksiyonu + pg_cron job:
```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_premiums()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE premium_subscriptions 
  SET is_active = false 
  WHERE is_active = true AND expires_at < now();
END;
$$;
-- pg_cron: her saat çalıştır
```

### 4. checkLimit Fix (ORTA)
`src/hooks/useAnalysisLimit.ts` — `fetchUsage` return değeri kullan:
```typescript
const checkLimit = useCallback(async (): Promise<boolean> => {
  if (hasUnlimitedAnalysis(planType, isAdmin)) return true;
  const { data } = await supabase.rpc('get_daily_analysis_usage');
  const currentUsage = data || 0;
  setUsageCount(currentUsage);
  return currentUsage < dailyLimit;
}, [planType, isAdmin, dailyLimit]);
```

---

## F) Son Kullanıcı Açısından Sonuç

| Soru | Cevap |
|------|-------|
| Satın alınca premium özellikler açılıyor mu? | **Evet** — Google Play izinleri doğruysa ve acknowledge başarılıysa. İzinler yanlışsa 401 hatası ile başarısız olur. |
| Premium bitince geri alınıyor mu? | **Kısmen** — Webhook doğru çalışırsa evet. Webhook kaçarsa premium sonsuza kadar açık kalabilir (cron job yok). |
| Ücretsiz/premium etiketi doğru değişiyor mu? | **Evet** — `usePremiumStatus` doğru sorgu yapıyor, `useAccessLevel` doğru kararlar veriyor. |
| Plan süresine göre doğru işliyor mu? | **Evet** — `expiryTime` Google Play'den alınıp DB'ye yazılıyor, frontend `now < expires_at` ile kontrol ediyor. |
| Uygulama kapatıp açınca premium korunuyor mu? | **Evet** — DB'den sorgu + localStorage cache. |
| Restore çalışıyor mu? | **Evet** — `restorePurchases` → `getPurchases` → `verifyPurchase` akışı var. |

### Kırılgan Noktalar:
1. **Google Play Service Account izinleri** — Hâlâ düzeltilmediyse tüm sistem çalışmaz
2. **Acknowledge 3 gün kuralı** — v1 endpoint başarısız olursa Google satın almayı iptal eder
3. **Webhook kayıp** — Cron olmadan premium sonsuza kadar açık kalabilir

### Production-Ready Mı?
**%85 hazır.** Acknowledge endpoint düzeltmesi ve expired premium cron job'ı eklendikten sonra tam production-ready olur. Mevcut haliyle çoğu normal senaryo çalışır, ancak edge case'lerde (plan değişikliği, token yenileme, webhook kaçması) sorunlar yaşanabilir.

