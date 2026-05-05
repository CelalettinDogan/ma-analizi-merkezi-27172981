## Sorun

Streak ödülleri DB'de doğru veriliyor (`bonus_chat`, `bonus_analysis`), ama `ai-chatbot` edge function bonus credit'leri **hiç tanımıyor**:

1. **Free kullanıcı** bonus_chat kazansa bile 403 ACCESS_DENIED alıyor.
2. **Premium kullanıcı** günlük plan limitini doldurduğunda bonus_chat varsa bile 429 LIMIT_EXCEEDED alıyor.

Sonuç: Frontend (`useChatbot.ts`) bonus'u önceden tüketiyor → sunucu reddediyor → kullanıcı hakkını kaybediyor, cevap alamıyor.

## Çözüm

### 1. `supabase/functions/ai-chatbot/index.ts` — server-authoritative bonus akışı

Frontend'in bonus tüketmesini kaldırıp tüm mantığı edge function'a taşı:

- Plan ve admin kontrolünden sonra, `chatbot_usage` sayısını al.
- Free kullanıcı için: 403 dönmeden önce `streak_rewards`'tan kullanılabilir `bonus_chat` quantity > 0 kontrolü yap. Varsa devam et, response'ta `usedBonus: true` işaretle.
- Premium kullanıcı için: `currentUsage >= dailyLimit` ise yine bonus kontrolü yap; varsa devam, yoksa 429.
- Başarılı yanıt **gönderildikten sonra**:
  - Plan limiti dahilinde ise → `increment_chatbot_usage` (mevcut davranış).
  - Bonus kullanılacaksa → `use_bonus_credit('bonus_chat')` RPC'sini çağır (atomik, advisory lock'lu zaten).
- Response payload'una `bonusRemaining` ekle (DB'den taze sayı).

### 2. `src/hooks/useChatbot.ts` — client tarafı sadeleştirme

- `useBonusCredit('bonus_chat')` çağrısını **sendMessage başlangıcından kaldır** (server tüketecek).
- Sunucu cevabındaki `usage` + `bonusRemaining` ile state'i güncelle.
- Hata durumunda yanlışlıkla bonus tüketilmiş olmasın (atomicity sunucuda garanti).
- `hasAccess` koşulu olduğu gibi kalabilir (UI gating için doğru).

### 3. Test

`src/test/streak/streakRewards.test.ts` simülatörünü güncelle: yeni server akışını yansıtan T16 senaryosu ekle:
- T16a: Free + bonus_chat=2 → 2 mesaj başarılı, 3.'de 403.
- T16b: Premium Basic plan limiti (3) dolduktan sonra bonus_chat=1 → 4. mesaj bonus'tan geçer, 5. 429.

### 4. Manuel doğrulama

E2E olarak `supabase--curl_edge_functions` ile `/ai-chatbot` çağırıp DB'deki test kullanıcısı için:
- Bonus harcanışı `streak_rewards.used` / `quantity` üzerinden doğrulanır.
- Frontend usage göstergesi anında günceller.

## Etkilenen dosyalar

- `supabase/functions/ai-chatbot/index.ts` (free 403 + 429 dallarında bonus fallback, sonunda `use_bonus_credit` çağrısı)
- `src/hooks/useChatbot.ts` (client-side bonus tüketimini kaldır, sunucu cevabını uygula)
- `src/test/streak/streakRewards.test.ts` (T16 senaryoları)

DB şeması veya RPC değişikliği **gerekmiyor** — `use_bonus_credit` ve `get_bonus_credits` zaten doğru çalışıyor, edge function bunları kullanmıyordu.