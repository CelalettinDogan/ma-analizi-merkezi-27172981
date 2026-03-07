

# Satın Alma Sistemi — Sorun Analizi ve Düzeltme Planı

## Sorunun Kökü

Edge function loglarında net bir hata var:

```text
Google Play verification failed: 401
"The current user has insufficient permissions to perform the requested operation."
reason: "permissionDenied"
```

Satın alma Android cihazda başarıyla gerçekleşiyor, ancak backend doğrulaması başarısız oluyor. Bu yüzden veritabanına abonelik kaydı yazılmıyor ve kullanıcı premium özelliklerden yararlanamıyor. "edge non code" hatası da bu doğrulama hatasının kullanıcıya yansıması.

## İki Sorun Var

### Sorun 1: Google Play Console İzinleri (Manuel Ayar)

Service Account'ın Google Play Console'da yeterli izni yok. Bu bir kod sorunu değil — Google Play Console'dan ayarlanması gerekiyor:

1. **Google Play Console** → Ayarlar → API erişimi
2. Service Account'ı bul (GOOGLE_PLAY_SERVICE_ACCOUNT_KEY JSON'daki `client_email`)
3. "Erişimi yönet" → Şu izinleri ver:
   - **Finansal verileri görüntüle**
   - **Siparişleri ve abonelikleri yönet**
4. Uygulama iznini **tüm uygulamalar** veya **app.golmetrik.android** olarak ayarla
5. Değişikliklerin yayılması 15-30 dakika sürebilir

### Sorun 2: Eski API Versiyonu (Kod Değişikliği)

Her iki edge function da Google Play **Subscriptions v3 API** kullanıyor. Ancak yeni Base Plan modeli (basic-monthly gibi planIdentifier'lar) ile **Subscriptions v2 API** daha uyumlu ve önerilen modern API.

v3 API URL'i subscription ID'yi path'te bekliyor — bu eski model. v2 API ise sadece purchaseToken ile çalışıyor ve tüm bilgiyi döndürüyor.

```text
// Eski (v3) — sorunlu:
/v3/applications/{pkg}/purchases/subscriptions/{subId}/tokens/{token}

// Yeni (v2) — önerilen:
/v3/applications/{pkg}/purchases/subscriptionsv2/tokens/{token}
```

## Yapılacak Değişiklikler

### 1. `supabase/functions/verify-purchase/index.ts`

- `verifyGooglePlaySubscription` fonksiyonunu v2 API'ye geçir
- v2 yanıt formatını parse et (farklı field isimleri: `lineItems`, `expiryTime` vs.)
- `acknowledgeSubscription` fonksiyonunu v2 endpoint'e güncelle
- Hata mesajlarını Türkçe ve kullanıcı dostu yap

### 2. `supabase/functions/play-store-webhook/index.ts`

- `getSubscriptionDetails` fonksiyonunu aynı şekilde v2 API'ye geçir
- v2 yanıt formatına göre field mapping'i güncelle

### 3. `src/services/purchaseService.ts`

- `verifyPurchase` hata yakalama ve kullanıcıya gösterilen mesajları iyileştir
- Edge function'dan dönen spesifik hataları (izin, token, config) ayrıştır

## Sistem Akışı (Düzeltme Sonrası)

```text
Kullanıcı → Play Store → Satın alma başarılı
  → purchaseToken alınır
  → verify-purchase Edge Function çağrılır
  → Google Play v2 API ile doğrulama
  → premium_subscriptions tablosuna kayıt
  → Kullanıcı premium olarak işaretlenir
  → İptal/süre dolumu → play-store-webhook otomatik günceller
```

## Önemli Not

Kod değişiklikleri yapılsa bile, **Google Play Console'daki Service Account izinleri düzeltilmeden** sistem çalışmayacak. Bu adım manuel olarak yapılmalı.

