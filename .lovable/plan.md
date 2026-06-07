
## Plan — FIFA Dünya Kupası 2026 (WC) Entegrasyonu

football-data.org API'sinde `WC` (id: 2000) kodu altında 11 Haziran – 19 Temmuz 2026 arası 104 maç hazır. Mevcut sync altyapısına WC'yi ekleyip uygulamada görünür kılacağız. Milli takım maçları için tahmin motorunu nötr saha + form bilgisi olmayan duruma uyarlayacağız.

### 1) Sabitlere WC eklenmesi

**`src/constants/predictions.ts`**
- `LEAGUE_CODES.WORLD_CUP = 'WC'`
- `LEAGUE_NAMES['WC'] = 'FIFA Dünya Kupası 2026'`

**`src/types/footballApi.ts`** — `SUPPORTED_COMPETITIONS` listesine WC (id: 2000, kod: WC, emblem) eklenecek; `CompetitionCode` tipi otomatik genişler.

**`src/components/league/LeagueGrid.tsx`** — WC kartı (özel renk + dünya ikonu) eklenecek; turnuva 19 Temmuz'da bittiğinde otomatik gizlenmesi için tarih kontrolü.

### 2) Edge function'larda WC desteği

**`supabase/functions/sync-matches/index.ts`**
- `SUPPORTED_LEAGUES`'e `'WC'` eklenir → 7sn rate-limit gecikmesi ile API'den çekilir, mevcut `cached_matches` upsert mantığı aynen çalışır.

**`supabase/functions/sync-standings/index.ts`**
- WC'yi ekler. Grup aşaması: API `type=TOTAL` ile grup başına ayrı tablo döner (`group: "GROUP_A"` vb.). Mevcut `cached_standings` şeması yeterli — bir `group` (text, nullable) kolonu migration ile eklenir.

**`supabase/functions/sync-live-matches/index.ts`**
- WC eklenir (turnuva sırasında canlı skor).

**`supabase/functions/auto-verify/index.ts`** — LEAGUE_MAP'e WC eklenir (sonuç doğrulama).

### 3) Veritabanı şema güncellemesi

Migration:
```sql
ALTER TABLE public.cached_standings ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE public.cached_standings ADD COLUMN IF NOT EXISTS stage text; -- GROUP_STAGE, LAST_16, ...
ALTER TABLE public.cached_matches ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE public.cached_matches ADD COLUMN IF NOT EXISTS group_name text;
```
(GRANT'ler zaten mevcut; sadece kolon ekleme.)

### 4) Tahmin motoru — Milli takım modu

**Sorun:** API milli takımlar için lig formu/xG/ev avantajı dönmüyor. Mevcut FMS motoru bu parametrelerle çalışır.

**Çözüm — `src/utils/predictionEngine.ts`:**
- `competitionCode === 'WC'` ise:
  - `home_advantage = 0` (nötr saha — tüm maçlar ABD/Kanada/Meksika'da)
  - `league_form` ağırlığı %0 → yerine **H2H** (api'den `head2head` endpoint'i mevcut) + **grup puan durumu** kullanılır
  - Poisson hesaplaması grup içi ortalama gollere göre yapılır (`league_averages` tablosuna fallback)
  - AI promptuna "Bu maç milli takım turnuva maçıdır; lig formu yerine son uluslararası maçlar ve H2H değerlendirilir" notu eklenir.

### 5) UI uyarlamaları

**`src/components/standings/StandingsTable.tsx`** — WC için grup bazlı render (A, B, C... grupları ayrı tablolar).

**`src/components/MatchCard` / hero** — WC maçlarına "🏆 Dünya Kupası" rozeti + grup/aşama etiketi (örn. "Grup A · 1. Maç" / "Çeyrek Final").

**Bracket (faz 2'ye ertelenir)** — eleme turu görselleştirmesi şu an kapsam dışı; sadece liste + grup tabloları.

### 6) İlk dolum

Migration sonrası manuel tetikleme:
- `sync-matches` → 104 WC maçı `cached_matches`'e düşer
- `sync-standings` → 8 grup tablosu `cached_standings`'e düşer
- Auto-verify cron zaten 6 saatte bir → turnuva başlayınca sonuçlar otomatik doğrulanır

### Teknik detaylar
- API rate limit: WC ekleyince toplam 7 lig × 7sn = ~49sn/sync — mevcut cron aralıklarıyla uyumlu.
- `LEAGUE_MAP` (auto-verify): `'WC': 2000`.
- `cached_matches.competition_code` zaten free-text → ek constraint yok.
- Memory: `mem://features/world-cup-2026-support` dosyası oluşturulur (nötr saha kuralı, grup bazlı standings, turnuva tarih aralığı).

### Kapsam dışı (faz 2)
- Eleme bracket görselleştirmesi
- FIFA ranking entegrasyonu (ayrı API gerekir)
- Milli takım son 10 maç form bilgisi (API kapsamı dışı)
- Özel "Dünya Kupası özel" promosyon/push kampanyası

### Tahmini iş yükü
Tek oturum (~30 dk): 3 edge function + 2 frontend dosyası + 1 migration + tahmin motoru WC dalı.
