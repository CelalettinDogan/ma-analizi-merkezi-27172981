
# Google Play Billing Entegrasyonu ve Backend Premium Yetkilendirme Planı

## Mevcut Durum Analizi

### ✅ Zaten Mevcut Olanlar
| Bileşen | Durum | Açıklama |
|---------|-------|----------|
| `premium_subscriptions` tablosu | ✅ Mevcut | Google Play alanları (purchase_token, order_id, product_id, auto_renewing, purchase_state, acknowledged) mevcut |
| `verify-purchase` Edge Function | ✅ Mevcut | Google Play Developer API ile token doğrulama, acknowledge, DB kayıt |
| `play-store-webhook` Edge Function | ✅ Mevcut | RTDN (Real-Time Developer Notifications) desteği |
| Erişim seviyeleri | ✅ Mevcut | `accessLevels.ts` - Free: 2 analiz, 0 chat / Basic: 3 chat / Plus: 5 chat / Pro: 10 chat |
| UI Bileşenleri | ✅ Mevcut | PremiumUpgrade, PremiumGate, ChatLimitSheet, AnalysisLimitSheet |
| Limit takibi | ✅ Mevcut | `chatbot_usage`, `analysis_usage` tabloları ve RPC fonksiyonları |

### ⚠️ Düzeltilmesi Gereken Noktalar

| Sorun | Açıklama |
|-------|----------|
| Paket ID uyumsuzluğu | Mevcut: `premium_basic_monthly`, `premium_plus_monthly`, `premium_pro_monthly` → İstenen: `premium_starter_monthly`, `premium_pro_monthly`, `premium_elite_monthly` |
| Plan isimleri uyumsuzluğu | Mevcut: Basic/Plus/Pro → İstenen: Starter/Pro/Elite |
| Google Play Service Account | `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` secret'ı tanımlı değil |
| Google Play Package Name | `GOOGLE_PLAY_PACKAGE_NAME` secret'ı tanımlı değil |
| Native purchase eklentisi | purchaseService'de placeholder - gerçek eklenti entegrasyonu gerekli |

---

## Uygulama Planı

### Aşama 1: Paket ID ve İsimlendirme Güncellemesi

**1.1 - `src/constants/accessLevels.ts` Güncellemesi**

Mevcut plan tipleri ve isimleri yeni yapıya dönüştürülecek:

```text
Eski Format → Yeni Format:
- premium_basic → premium_starter
- premium_plus → premium_pro  
- premium_pro → premium_elite

Plan Limitleri (değişmez):
- Starter: 3 chat/gün, sınırsız analiz
- Pro: 5 chat/gün, sınırsız analiz
- Elite: 10 chat/gün, sınırsız analiz
```

**1.2 - `src/services/purchaseService.ts` Güncellemesi**

Product ID'ler güncellenecek:

```text
Yeni Product ID'ler:
- premium_starter_monthly
- premium_starter_yearly
- premium_pro_monthly
- premium_pro_yearly
- premium_elite_monthly
- premium_elite_yearly
```

**1.3 - Tüm UI Bileşenlerinde İsim Güncellemesi**

- `PremiumUpgrade.tsx`
- `PremiumGate.tsx`
- `ChatLimitSheet.tsx`
- `AnalysisLimitSheet.tsx`

---

### Aşama 2: Backend Edge Functions Güncellemesi

**2.1 - `verify-purchase/index.ts` - getPlanType() Fonksiyonu**

Yeni plan mapping:

```text
productId içerikleri:
- "premium_starter" → "premium_starter"
- "premium_pro" → "premium_pro"  
- "premium_elite" → "premium_elite"
```

**2.2 - `play-store-webhook/index.ts`**

Plan tipi çözümleme aynı mantıkla güncellenecek.

---

### Aşama 3: Native Purchase Plugin Entegrasyonu

**3.1 - purchaseService.ts'de Gerçek Native Flow**

```text
İş akışı:
1. Kullanıcı satın al butonuna tıklar
2. Native plugin ile Google Play ödeme ekranı açılır
3. Ödeme başarılı olursa purchaseToken alınır
4. Token backend'e gönderilir (verify-purchase)
5. Backend Google'dan doğrular
6. Premium kaydı oluşturulur
7. Frontend premium durumu günceller
```

**3.2 - Paket Bağımlılığı**

`@capawesome/capacitor-purchases` veya benzer bir plugin kullanılacak. Bu Capacitor projesinde zaten kurulu değil, documentation'a yönlendirme yapılacak.

---

### Aşama 4: Eksik Secrets Tanımlama

Aşağıdaki secret'ların eklenmesi gerekiyor:

| Secret | Açıklama |
|--------|----------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | Google Cloud Console'dan alınan JSON service account key |
| `GOOGLE_PLAY_PACKAGE_NAME` | `app.golmetrik.android` |

---

### Aşama 5: Veritabanı Tutarlılık Kontrolü

Mevcut `premium_subscriptions` tablosundaki eski `plan_type` değerleri yeni isimlere migrate edilecek:

```text
Migration:
- premium_basic → premium_starter
- premium_plus → premium_pro
- premium_pro → premium_elite
```

---

## Dosya Değişiklikleri Özeti

| Dosya | İşlem | Açıklama |
|-------|-------|----------|
| `src/constants/accessLevels.ts` | Düzenleme | PlanType enum ve tüm ilgili constant'lar |
| `src/services/purchaseService.ts` | Düzenleme | Product ID'ler ve plan bilgileri |
| `src/components/premium/PremiumUpgrade.tsx` | Düzenleme | Plan isimleri ve UI |
| `src/components/chat/PremiumGate.tsx` | Düzenleme | Plan isimleri |
| `src/components/chat/ChatLimitSheet.tsx` | Düzenleme | Plan isimleri |
| `src/components/premium/AnalysisLimitSheet.tsx` | Düzenleme | Plan isimleri |
| `src/hooks/usePremiumStatus.ts` | Düzenleme | Plan type mapping |
| `supabase/functions/verify-purchase/index.ts` | Düzenleme | getPlanType() fonksiyonu |
| `supabase/functions/play-store-webhook/index.ts` | Düzenleme | Plan type çözümleme |
| Veritabanı migration | Yeni | Eski plan_type değerlerini güncelle |

---

## Güvenlik Kontrolü

### ✅ Mevcut Güvenlik Önlemleri
- Premium kontrolü backend'de yapılıyor (`verify-purchase`, `ai-chatbot`)
- RLS politikaları mevcut (`premium_subscriptions` tablosunda)
- JWT doğrulaması her edge function'da var
- Günlük limitler `auth.uid()` ile korunuyor

### ⚠️ Ek Kontroller
- Client tarafında premium durumu ASLA güvenilmez kabul edilecek
- Her API isteğinde backend'de premium ve limit kontrolü yapılacak

---

## Play Store Uyumluluk Kontrolü

### ✅ Zaten Uyumlu
- Abonelik otomatik yenileme uyarıları UI'da mevcut
- İptal yönlendirmesi Google Play Store'a yapılıyor
- Legal metinler (Kullanım Şartları, Gizlilik Politikası) mevcut

### ✅ Mobil-Only Kontrol
- "Uygulamayı indir" gibi ifadeler YOK
- Tüm satın almalar Play Store üzerinden

---

## Sonraki Adımlar

1. **Secret'ları ekle** - `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` ve `GOOGLE_PLAY_PACKAGE_NAME`
2. **Kod değişikliklerini uygula** - Plan isimleri ve ID'ler
3. **Veritabanı migration** - Eski plan_type değerlerini güncelle
4. **Native plugin kurulumu** - Capacitor projesinde satın alma eklentisi
5. **Test** - APK build alıp gerçek cihazda test
