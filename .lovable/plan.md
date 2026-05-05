## Amaç

Backend'deki `grant_streak_reward_for_user` fonksiyonu artık şu kuralları işliyor:
- **3 gün** → +1 Bonus Analiz
- **7 gün** → +1 Bonus Sohbet (30 gün cooldown ile, sadece 1 kez)
- **14 gün** → Sadece rozet (chat yok)
- **30 gün** → 1 günlük Premium deneme

Ancak Profil → Streak Rewards kartı ve `/rewards` sayfası hâlâ eski kuralları (5 gün chat, 7 gün +2 chat, 14 gün +3 chat + rozet) gösteriyor. Kullanıcı yanlış beklenti oluşturuyor. Bunu UI'da düzeltiyoruz.

## Değişiklikler

### 1. `src/components/streak/StreakRewardsCard.tsx`
`MILESTONES` dizisinden `day: 5` kaldır. 5 milestone → 4 milestone (3, 7, 14, 30).

### 2. `src/pages/Rewards.tsx`
Aynı şekilde `MILESTONES` dizisinden 5 günlük girdi kaldırılacak. `milestone` sayacı (X/5 → X/4) otomatik güncellenecek.

### 3. Lokalizasyon (`rewards.json` — tr, en, de, es, ar)
- `day5` anahtarını kaldır (artık kullanılmıyor)
- `day7` → "+1 AI Sohbet Hakkı" (eski: +2)
- `day14` → "Özel Rozet" (eski: +3 AI Chat + rozet)
- `day3` ve `day30` aynı kalır

Aynı düzeltmeyi 5 dilin tamamına uygula.

### 4. Doğrulama
Profil sayfasındaki StreakRewardsCard ve `/rewards` sayfası artık simulator/SQL ile birebir aynı milestone setini gösteriyor olacak. Mevcut testler (streakRewards.test.ts) zaten yeni kurallarla geçtiği için ek test gerekmiyor.

## Etkilenmeyen alanlar
- DB fonksiyonu, Edge Function, hook'lar, testler — değişmiyor.
- `streak.json` lokali (ayrı amaca hizmet ediyor) — değişmiyor.
