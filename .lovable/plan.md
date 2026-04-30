
# Premium Teşvik & Ek Gelir Yol Haritası

Ücretsiz deneme ve haftalık plan hariç tutuldu. 4 faz halinde, her faz tek başına yayınlanabilir ve değer üretir. Tüm faturalandırma Google Play (Android-only) üzerinden, hiçbir web ödeme akışı eklenmez.

---

## Faz 1 — Mevcut Premium'a Dönüşümü Artırma (Düşük risk, hızlı kazanım)

Yeni Play Store ürünü gerektirmeyen, sadece UI/UX ve mevcut limit akışlarına dokunan değişiklikler.

### 1.1 AI Yorum "Teaser" (Blur Önizleme)
- Free kullanıcı analiz açtığında AI yorumu/AI özetini ilk 1-2 satır net, kalanı `backdrop-blur-md` + gradient mask.
- Üzerine "Premium ile tamamını aç" CTA → `/premium`.
- Dosyalar: `AnalysisHeroSummary.tsx`, `AIRecommendationCard.tsx`, yeni `PremiumTeaserOverlay` component.

### 1.2 Limit Yaklaşma Uyarısı
- 1/2 kullanıma gelen Free kullanıcıya 2. analizden önce ince bir banner: "Son ücretsiz analizin. Premium ile sınırsız."
- `useAnalysisLimit` zaten `remaining` veriyor → `FilteredPredictionsSection` üzerine `LastAnalysisWarningBanner`.

### 1.3 Yıllık Plan Tasarruf Vurgusu Güçlendirme
- `Premium.tsx` plan kartlarında yıllık seçildiğinde:
  - Üstü çizili aylık × 12 fiyat
  - "₺X tasarruf" rozeti (Amber)
  - Ay bazında kıyas barı (yatay progress)
- Sadece i18n + render değişikliği.

### 1.4 Karşılaştırma Tablosu
- Premium sayfasında plan kartlarının altında Free vs Basic vs Plus vs Pro tablo (sınırsız analiz, AI mesaj, geçmiş, derinlik, vb.).
- Sticky kolon başlıkları, mobile-first 4 sütun.

### 1.5 Sosyal Kanıt — Gerçek Veri
- `Premium.tsx` üst kısmına: "Bu hafta 47 kullanıcı Premium'a geçti" (admin_activity_logs veya premium_subscriptions tablosundan rolling 7 gün count).
- Yeni RPC: `get_recent_premium_count()` (security definer, sadece sayı döner).

**Faz 1 sonunda:** Tüm bunlar çalışır, ek satın alma yok, sadece dönüşüm artırma.

---

## Faz 2 — Lojalti & Davranışsal Tetikleyiciler

Hâlâ ek Play Store ürünü yok; mevcut planlara talep yaratmak için.

### 2.1 Streak Sistemi (Analiz Serisi)
- Yeni tablo: `user_streaks (user_id, current_streak, longest_streak, last_active_date)`.
- Her analizde RPC: `update_streak()` günü +1, gap olduğunda sıfırlar.
- Profile'da görünür: "🔥 7 gün serisi". 7/14/30 günde içsel rozet.
- 30 gün serisi tamamlayan Free kullanıcıya bir defaya mahsus indirim kuponu (Faz 3'te kullanılır).

### 2.2 Doğruluk Rozetleri (Predictor Score)
- `predictions` tablosu mevcut → kullanıcının kaydettiği tahminlerin doğruluğu zaten hesaplanabilir.
- Profile sayfasında "Predictor Score: %68" + rozet (Bronze/Silver/Gold/Pro).
- %70 üstü kullanıcıya "Pro Predictor" rozeti + Premium yükseltme indirimi.

### 2.3 Davranışsal Tetikleyiciler (Smart Promotions)
`usePremiumPromotion` hook'u genişletilir, yeni triggers:

| Tetikleyici | Promotion Type |
|-------------|----------------|
| 5. analiz denemesi (Free) | `power_user` |
| AI Chat tıklama (Free) | `chatbot` (mevcut) |
| Aynı maç 2. analiz | `deep_dive` |
| 7 gün üst üste açık (Free) | `loyal_user` |
| Premium iptal sayfası | `downgrade_save` |

Her trigger için yeni i18n key + `PremiumPromotionModal` varyantı.

### 2.4 Push Bildirim Tetikleri
- `push_notifications` tablosu mevcut → maç günü kampanya pushları için cron edge function: `send-promo-push`.
- Hedefli: "Free 7+ gün aktif" segmenti, "Premium 30+ gün aktif" segmenti.

**Faz 2 sonunda:** Kullanıcı bağlılığı + akıllı upsell, hâlâ tek satış kanalı abonelik.

---

## Faz 3 — Yeni Satın Alma Kanalları (Consumable + Non-Consumable)

İlk gerçek yeni gelir akışları. Google Play Console'da yeni ürünler oluşturulması gerekir.

### 3.1 Backend Altyapı
**Yeni tablo:** `user_credits`
```
- id, user_id, credit_type ('analysis' | 'chat'), 
- amount, source ('purchase' | 'gift' | 'streak_reward'),
- expires_at (nullable, pass'ler için),
- created_at, used_at
```

**Yeni tablo:** `iap_purchases` (consumable + non-consumable lifetime ürünler için)
```
- id, user_id, product_id, purchase_token (unique),
- order_id, purchase_type ('consumable' | 'non_consumable'),
- consumed (bool), created_at, verified_at
```

**Yeni RPC'ler:**
- `get_user_credits(credit_type)` → toplam kredi
- `consume_credit(credit_type, amount)` → atomik tüketim
- `add_credits(credit_type, amount, source, expires_at)` (service role only)

**Edge function genişletmesi:** `verify-purchase` → `purchaseType` parametresi alıp:
- `subscription` → mevcut akış
- `inapp` → Play `products.purchases.get` API + consume + `iap_purchases` insert + kredi/lifetime aktivasyon

**`useAnalysisLimit` & `useChatLimit` güncellemesi:**
- Plan limiti dolduğunda → önce `user_credits` kontrol → varsa consume_credit, yoksa limit sheet.

### 3.2 İlk Consumable Ürünler (Play Console'da oluşturulur)

| Product ID | Tür | Fiyat | Verir |
|------------|-----|-------|-------|
| `credits_analysis_5` | consumable | ₺19,99 | +5 analiz (30 gün geçerli) |
| `credits_chat_10` | consumable | ₺14,99 | +10 AI mesaj (30 gün geçerli) |
| `pass_match_day_24h` | consumable | ₺29,99 | 24 saat sınırsız analiz + chat |

### 3.3 İlk Non-Consumable Ürünler

| Product ID | Tür | Fiyat | Verir |
|------------|-----|-------|-------|
| `lifetime_no_ads` | non-consumable | ₺99,99 | Free kullanıcı için reklamsız (gelecek hazırlığı) |
| `lifetime_history_365d` | non-consumable | ₺149,99 | Geçmiş 7 gün → 365 gün |

**Not:** Lifetime ürünler `premium_subscriptions` yerine yeni `user_entitlements` tablosunda tutulur, `useAccessLevel` bu entitlement'ları okur.

### 3.4 UI Entegrasyonu
- Limit sheet'lere "Bekleme yapma, paket al" alternatifi (`AnalysisLimitSheet`, `ChatLimitSheet`).
- `Premium.tsx` üzerine yeni "Tek Seferlik Paketler" sekmesi (Abonelik | Paketler segmented control).
- Yeni `OneTimePurchaseCard` component, mevcut `PurchaseButton` genişletilir (`purchaseType` prop).

### 3.5 Play Console İş Yükü (Kullanıcı yapar)
- 5 yeni in-app product oluştur
- Service account zaten `androidpublisher` scope'una sahip → ek izin gerekmez
- Localized fiyatlar Play Console'dan otomatik gelir

**Faz 3 sonunda:** Free kullanıcılar abone olmadan ödeyebilir; ARPU artar.

---

## Faz 4 — Premium Kullanıcı LTV & Sosyal Büyüme

Mevcut Premium tabanından daha fazla gelir + organik büyüme.

### 4.1 Sezon/Etkinlik Paketleri (Non-Consumable, dönemsel)
| Product ID | Fiyat | Açıklama |
|------------|-------|----------|
| `pack_derby_2026` | ₺79,99 | Sezonun 10 büyük derbisi için derinleştirilmiş analiz + özel rozet |
| `pack_champions_league_2026` | ₺99,99 | Tüm CL maçları için xG+, taktik board, manager analizi |

- `match_tags` tablosuna `derby`, `cl_special` etiketleri eklenmiş zaten.
- Premium kullanıcının bile satın alabildiği "derinlik" katmanı.
- `AnalysisHeroSummary` üst köşede "Derby Pack ile aç" CTA.

### 4.2 Premium Hediye Etme (Gift Codes)
- Yeni tablo: `gift_codes (code, sender_user_id, plan_type, duration_days, redeemed_by, redeemed_at, expires_at)`.
- Yeni Play Console ürünü: `gift_premium_basic_1month` (₺94,99), `gift_premium_plus_1month` (₺149,99).
- Satın alındığında `verify-purchase` benzersiz 12-haneli kod üretir → kullanıcı paylaşır.
- Yeni sayfa: `/gift/redeem` (deep link `golmetrik://gift?code=XXX`).
- Profile'da "Hediye Et" menü öğesi.

### 4.3 Davet Et & Kazan (Referral)
- `profiles` tablosuna `referral_code` (unique 8-char) eklenir, trigger'la otomatik üretilir.
- Yeni tablo: `referrals (referrer_id, referred_id, status, rewarded_at)`.
- Yeni RPC: `claim_referral(code)` — yeni kullanıcı kayıt olduktan sonra kod girer.
- Ödül kuralı: 3 başarılı referans → 1 ay Plus ücretsiz (`add_credits` ile entitlement uzatma).
- Profile'da "Arkadaşını Davet Et" + paylaşım sheet.

### 4.4 Aile Paketi (Yeni Subscription Tier)
- Yeni Play Console aboneliği: `premium_family_monthly` (₺149,99/ay), `premium_family_yearly` (₺1499/yıl).
- 1 hesap → 4 cihaza kadar oturum.
- Yeni tablo: `family_groups (id, owner_user_id, plan_type)` + `family_members (group_id, user_id, joined_at)`.
- Owner Profile'dan davet kodu üretir, üye `golmetrik://family?code=XXX` ile katılır.
- `useAccessLevel` family üyeliğini de `isPremium` olarak okur.

**Faz 4 sonunda:** Mevcut Premium kullanıcılardan ek satın alma + organik kullanıcı kazanımı.

---

## Teknik Notlar

- **Uyumluluk:** Tüm satın almalar Google Play Billing üzerinden yapılır, "guaranteed profits" gibi ifadeler kullanılmaz, AI mesajları olasılıksal dilde kalır (mevcut memory kuralları).
- **Backend Authorization:** Yeni RPC'lerin tümü `auth.uid()` kullanır, hiçbiri `user_id` parametresi almaz (mevcut hardening kuralı).
- **i18n:** Her faz için 5 dilde (TR/EN/DE/ES/AR) lokalizasyon `premium.json` içine eklenir.
- **Versiyon:** Faz 3 ve 4'te yeni Play Console ürünleri eklendikten sonra Capacitor `versionCode` artırılır (mevcut süreç).
- **Test:** Her faz Play Console "License Tester" hesabı ile sandbox'ta doğrulanır.

---

## Faz Süresi & Öncelik

| Faz | Tahmini İş | Yeni Play Ürünü | Yeni DB Tablosu | Hemen Etkisi |
|-----|------------|-----------------|-----------------|--------------|
| 1   | 1-2 oturum | Yok             | Yok             | Dönüşüm +    |
| 2   | 2-3 oturum | Yok             | 1 (streaks)     | Bağlılık +   |
| 3   | 3-4 oturum | 5               | 2 (credits, iap) | ARPU ++     |
| 4   | 4-5 oturum | 4               | 4 (gift, referral, family) | Büyüme + LTV ++ |

---

## Onay Sonrası Akış

Onayladığında **Faz 1**'den başlarım. Her fazın sonunda durup test et, sonra bir sonraki faza geçeriz. Bir fazı atlamak veya sıralamayı değiştirmek istersen şimdi söyle.
