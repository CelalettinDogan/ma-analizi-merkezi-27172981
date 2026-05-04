# Seri Ödülleri — Profesyonelleştirme Planı

## Mevcut Durumun Tanısı (canlı veriden)

| Bulgu | Kanıt |
|---|---|
| 2 kullanıcı 5 gün seriye ulaşmış | `user_streaks`: current_streak=5 |
| Ödül tablosu **boş** | `streak_rewards`: 0 satır |
| Yani vaat edilen 3 gün ve 5 gün ödülleri **hiç verilmemiş** | — |

### Kök Nedenler (kodda)

1. **Milestone tetikleyici eksik gün listesi** — `src/hooks/useStreak.ts` sadece `[3, 7, 14, 30, 60, 100]`'ü takip ediyor. **5 ve 14 günler eksik** → DB'deki `grant_streak_reward` RPC'si bu günlerde ödül üretse de client hiç çağırmıyor.
2. **Tek atımlık tetikleyici** — Ödül sadece `current_streak === N` tam eşleştiği gün, **StreakBadge bileşeni ekranda mount olduğunda** veriliyor. StreakBadge sadece `Index.tsx` (Ana sayfa) içinde. Kullanıcı uygulamayı 3. gün açıp doğrudan Profil'e gittiyse → ödül kaybolur, bir daha hiç alamaz.
3. **`sessionStorage` kapısı** — `streak_updated_today` flag'i milestone toast'unu engellemek için var, ama aynı zamanda ödül grant çağrısını da engelliyor.
4. **Geriye dönük telafi yok** — Mevcut 5 günlük kullanıcılara hiçbir mekanizma 3. gün ödülünü vermiyor.
5. **App resume / tarih değişimi algılaması yok** — `refetchOnWindowFocus: false`, Capacitor `App` resume event'i bağlı değil. Kullanıcı geceyi açık uygulamayla geçirip sabah dokunursa yeni gün olarak sayılmıyor.
6. **`premium_trial` ödülü ölü kod** — 30. gün veriliyor ama hiçbir yerde tüketilmiyor / premium aktive etmiyor.
7. **`streak-validator` cron'u doğrulanamadı** — fonksiyon var ama zamanlanmış olduğuna dair iz yok; kırılan seriler temizlenmeyebilir.

---

## Çözüm Planı

### 1. Ödül Verme Mantığını Sunucuya Taşı (tek doğru kaynak)
- `update_user_streak` RPC'si zaten her gün çağrılıyor. İçinde streak güncellendikten sonra **otomatik olarak** `grant_streak_reward` çağıracak şekilde DB fonksiyonunu birleştir.
- Böylece client-side milestone listesi ve `sessionStorage` kapısı tamamen devre dışı kalır; ödül veri girişiyle birlikte atomik olarak yazılır.

### 2. `grant_streak_reward` Fonksiyonunu Düzelt
- "Bu streak periyodunda zaten verildi mi?" kontrolünü 30 gün penceresi yerine **mevcut streak'in başlangıç tarihi**'yle yap (kullanıcı 30 gün üstünde seriye sahipse milestone'lar tekrar verilmesin, ama yeni bir seri başlattığında verilebilsin).
- Tüm milestone'ları `[3, 5, 7, 14, 30]` olarak garanti et (zaten DB'de doğru, sadece client'ı bypass etmek için tek kapı bu olacak).

### 3. Geriye Dönük Telafi (one-time backfill)
- Mevcut `current_streak` değerine göre hak edilmiş ama verilmemiş tüm ödülleri verecek bir migration çalıştır. Bu sayede şu anki 5 günlük 2 kullanıcı 3+5. gün ödüllerini hemen alır.

### 4. Capacitor App Resume + Tarih Değişimi Algılama
- Yeni hook `useStreakHeartbeat`:
  - Capacitor `App.addListener('appStateChange')` ile foreground'a dönünce `update_user_streak` invalidate.
  - `visibilitychange` web fallback.
  - Uygulama açıkken UTC tarih değiştiğinde (interval check 60sn) refetch.
- `App.tsx` kök seviyede mount.

### 5. `premium_trial` Ödülünü Gerçek Yap
- 30. gün geldiğinde: `premium_subscriptions` tablosuna 1 günlük `is_active=true, plan_type='trial'` satırı eklenecek (DB tarafında, `grant_streak_reward` içinde).
- Yoksa kullanıcıya somut bir karşılığı yok.

### 6. `streak-validator` Cron Garantisi
- `pg_cron` ile günlük 00:05 UTC schedule kur (kullanıcı-spesifik SQL `insert` aracıyla).
- Kırılan seriler güvenilir biçimde sıfırlansın.

### 7. UX İyileştirmeleri
- Ödül verildiğinde toast + light haptic (mevcut), ek olarak **"Telafi edildi" toast'u** kullanıcı geri açtığında görünsün (yeni granted ödüller için son N saniye penceresi).
- `Rewards.tsx` üstüne **"Bir sonraki ödüle X saat"** sayacı (UTC gece yarısı).
- Ödül kullanıldığında haptic medium + sayaç animasyonu (zaten kısmen var, doğrula).

### 8. Telemetri / Doğrulama
- `admin_activity_logs` içine `streak_reward_granted`, `streak_reset`, `bonus_credit_used` event'leri yaz → Admin panelinden gerçek çalıştığı izlenebilir.

---

## Dokunulacak Dosyalar

```text
DB migration:
  - update_user_streak (içine grant + premium_trial aktivasyonu)
  - grant_streak_reward (pencere mantığı düzeltme)
  - one-time backfill SQL

Kod:
  - src/hooks/useStreak.ts            (sessionStorage gate kaldır, milestone listesi tutarlı)
  - src/hooks/useStreakHeartbeat.ts   (YENİ — app resume + date change)
  - src/App.tsx                       (heartbeat mount)
  - src/components/streak/StreakBadge.tsx (grantRewards client çağrısı kaldır)
  - src/pages/Rewards.tsx             (geri sayım sayacı + son ödül vurgusu)
```

## Beklenen Sonuç

- Kullanıcı uygulamayı her açtığında seri **garanti** sayılır.
- Hak edilen tüm milestone ödülleri **kaçırılmadan** verilir (3, 5, 7, 14, 30).
- 30. gün premium trial **gerçekten** aktive olur.
- Geceyi geçen kullanıcı sabah uygulamaya dönünce yeni gün olarak işlenir.
- Mevcut serisi olan kullanıcıların geçmiş ödülleri telafi edilir.
- Admin panelinden ödül akışı izlenebilir.
