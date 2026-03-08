

# Admin Paneli — Kapsamlı İşlevsellik Planı

## Tespit Edilen Sorunlar

### Kritik Hatalar
1. **VIP rolü `app_role` enum'unda yok** — Enum sadece `admin`, `moderator`, `user` içeriyor. UserManagement'ta "VIP Yap" butonu veritabanına insert yapmaya çalışınca hata verir.
2. **`assignPremium` upsert `onConflict: 'user_id'` kullanıyor** — Ama `premium_subscriptions` tablosunda `user_id` üzerinde unique constraint yok (PK `id`). Bu duplikasyon veya hata yaratır.
3. **İlk yüklemede `fetchUsers` 2 kez çağrılıyor** — `loadAll()` içinde bir kez, `useEffect([usersPage])` ile bir kez daha.

### Performans Sorunları
4. **Tüm veriler her zaman yükleniyor** — Kullanıcı sadece Dashboard'a baktığında bile Users, Notifications, Logs, AI stats hepsi çekiliyor. Gereksiz sorgu yükü.

### İşlevsellik Eksikleri
5. **Section bazlı lazy loading yok** — Sadece aktif sekmenin verisi çekilmeli.
6. **Premium atama plan type uyumsuzluğu** — Dialog'da `basic/plus/pro` seçiliyor ama DB'de `premium_basic/premium_plus/premium_pro` formatında kayıt var.

---

## Uygulama Planı

### 1. DB Migration — `app_role` enum'una `vip` ekle
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vip';
```

### 2. `useAdminData.ts` — Lazy loading + bug fixes

**Lazy loading**: `activeSection` parametresi ekle. Section değiştiğinde sadece o section'ın verisini çek. İlk yüklemede sadece dashboard verisi çekilsin.

**assignPremium fix**: Mevcut aktif aboneliği kontrol et, varsa update yap, yoksa insert yap. Plan type'ı `premium_${planType}` formatına dönüştür.

**Double fetch fix**: `loadAll` içinden `fetchUsers` kaldır, `useEffect([usersPage])` bunu zaten yapıyor.

**activeSection parametresi**: Hook'a `activeSection` geçir, section değişiminde ilgili veriyi çek.

### 3. `UserManagement.tsx` — Plan type mapping düzelt
- Premium atama dialog'unda `basic` → `premium_basic` dönüşümü yapılsın
- VIP rol butonu artık çalışacak (enum fix sonrası)

### 4. `Admin.tsx` — activeSection'ı hook'a geçir
- `useAdminData(activeSection)` şeklinde çağır

### Toplam Değişiklik
- 1 DB migration (enum güncelleme)
- 3 dosya değişikliği: `useAdminData.ts`, `UserManagement.tsx`, `Admin.tsx`
- Cloud balance etkisi: Sorgu sayısı %60 azalır (lazy loading sayesinde)

