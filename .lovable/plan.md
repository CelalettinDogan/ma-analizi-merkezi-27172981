
## Amaç

1. **Kural değişikliği:** `bonus_chat` ödülü artık SADECE 7 günlük seri tamamlandığında ve son 30 gün içinde başka chat ödülü verilmemişse 1 kez verilir. (Bugün 5/7/14. günlerde de chat veriliyor — bu kaldırılacak.)
2. **Uçtan uca regresyon testleri:** Free kullanıcı bonus_chat kazanır → ilk istek 200, kredi tükenince sonraki istek 403. Premium plan limiti dolunca bonus’a düşer, o da bitince 429. Testler CI'da otomatik koşar.

## Değişiklikler

### 1. DB — yeni migration: `grant_streak_reward_for_user` güncellemesi

- Milestone tablosu yeniden tanımlanıyor:
  - **3 gün** → `bonus_analysis` ×1 (değişmedi)
  - **7 gün** → `bonus_chat` ×1, **ancak son 30 gün içinde herhangi bir `bonus_chat` ödülü verilmediyse**
  - **14 gün** → sadece `badge` (chat verilmiyor)
  - **30 gün** → `premium_trial` (değişmedi)
- 5. ve eski 7/14. gündeki chat grantları kaldırıldı.
- 30-gün kontrolü:
  ```sql
  NOT EXISTS (
    SELECT 1 FROM streak_rewards
    WHERE user_id = p_user_id
      AND reward_type = 'bonus_chat'
      AND granted_at > now() - interval '30 days'
  )
  ```
- Mevcut "bu streak penceresinde verildi mi?" kontrolü korunuyor (idempotency).

### 2. Simülatör — `src/test/streak/streakSimulator.ts`

- `MILESTONES` ve grant mantığı yeni SQL ile birebir senkronlanır.
- 30-gün cooldown'u state üzerinden kontrol eden helper eklenir.

### 3. Test — `src/test/streak/streakRewards.test.ts`

Mevcut T4/T5/T6 senaryoları yeni kurala göre güncellenir:
- T4 (5 gün) artık chat vermez.
- T5 (7 gün) tam olarak 1 chat verir.
- T6 (14 gün) yalnız badge ekler, chat=1 olarak kalır.

Yeni senaryolar:
- **T16 — 30-gün cooldown:** 7 gün streak → chat=1. Streak kırılıp 8 gün sonra tekrar 7 gün → cooldown aktif, chat verilmez. 31 gün sonraki yeni 7-gün serisi → chat verilir.
- **T17 — Free user uçtan uca tüketim:** bonus_chat=1 verildi → `useBonusCredit` true → ikinci çağrı false (krediyi geri alıyor).

### 4. Edge function regresyon testi — `supabase/functions/ai-chatbot/index.test.ts` (Deno)

`supabase--test_edge_functions` ile koşulan yeni Deno testi:
- Test kullanıcısı oluştur, bonus_chat=1 enjekte et (service role).
- 1. POST `/ai-chatbot` → 200, `bonusRemaining: 0`, `usedBonus: true`.
- 2. POST → 403 `ACCESS_DENIED` (free user, bonus tükendi).
- DB doğrulaması: `streak_rewards.used = true`.
- Premium senaryosu: plan limitini doldur → bonus_chat=1 ekle → 1 ek istek 200 → sonraki 429.

### 5. CI — `.github/workflows/ci.yml`

Mevcut `streak-e2e` job'una iki adım daha:
- `bunx vitest run src/test/streak/streakRewards.test.ts` (mevcut, güncellenmiş senaryolar dahil).
- Yeni `chatbot-e2e` job: `supabase functions test ai-chatbot` (Deno), service role secret CI'da zaten yok → bunun yerine vitest tarafında HTTP mock fixture'ı ile aynı akışı doğrulayan `aiChatbotBonus.test.ts` ekliyoruz (deterministic, secret gerektirmez). Manuel doğrulama için ayrı bir "manual smoke" notu README'ye eklenir.

## Etkilenen dosyalar

- `supabase/migrations/<new>.sql` — `grant_streak_reward_for_user` güncellemesi
- `src/test/streak/streakSimulator.ts` — milestone + 30-gün cooldown
- `src/test/streak/streakRewards.test.ts` — T4/T5/T6 güncel + T16/T17
- `src/test/streak/aiChatbotBonus.test.ts` — yeni, edge function akışını mock'layan test
- `.github/workflows/ci.yml` — yeni testlerin verbose koşumu

## Kabul kriterleri

- 7 gün serisi → chat hakkı 1 kez verilir, 30 gün içinde tekrar verilmez.
- Free kullanıcı bonus ile 1 mesaj atabilir, sonraki 403.
- Premium limit dolunca bonus tüketilir; bonus da bitince 429.
- Tüm testler CI’da yeşil; PR’larda otomatik bloklayıcı.
