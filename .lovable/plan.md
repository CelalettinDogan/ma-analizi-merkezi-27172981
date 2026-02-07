

# Cloud Balance Optimizasyon Plani

## Mevcut Durum Analizi

### Tespit Edilen Gereksiz Harcamalar

| No | Sorun | Konum | Maliyet Etkisi |
|----|-------|-------|----------------|
| 1 | Manuel sync-matches cagirisi | useHomeData.ts (satir 146-158) | Her anasayfa acilisinda 2 edge function |
| 2 | Manuel sync-live-matches cagirisi | Live.tsx (satir 183-186) | Her Live sayfa acilisinda 1 edge function |
| 3 | Manuel sync-standings cagirisi | Standings.tsx (satir 75-94) | Her puan durumu acilisinda 1 edge function |
| 4 | AI ml-prediction tekrari | useMatchAnalysis.ts (satir 324-404) | Ayni mac icin tekrar AI cagirisi |
| 5 | Chatbot benzer sorular | ai-chatbot edge function | Ayni takimlar icin tekrar AI cagirisi |

### Mevcut pg_cron Otomasyonu

```text
+-------------------+------------------+------------------------+
| Job               | Schedule         | Aciklama               |
+-------------------+------------------+------------------------+
| sync-live-matches | */15 * * * *     | Her 15 dakikada        |
| sync-matches      | */30 * * * *     | Her 30 dakikada        |
| sync-standings    | 0 * * * *        | Her saatte             |
| auto-verify       | 0 * * * *        | Her saatte             |
| sync-match-history| 0 4 * * *        | Gunluk 04:00           |
+-------------------+------------------+------------------------+
```

pg_cron zaten aktif oldugu icin frontend'den manuel sync cagirmak **gereksiz maliyet** olusturuyor.

---

## Optimizasyon Plani

### Optimizasyon 1: useHomeData'dan Manuel Sync Kaldirma
**Tahmini Tasarruf: 30-40%**

**Mevcut Sorun:**
- useHomeData hook'u her mount'ta `sync-matches` ve `sync-live-matches` cagiriyor
- pg_cron zaten 15-30 dakikada bu isleri yapiyor
- Gereksiz edge function maliyeti

**Cozum:**
```typescript
// KALDIRILACAK KOD (useHomeData.ts satir 146-158):
const syncMatches = useCallback(async () => {
  await Promise.all([
    supabase.functions.invoke('sync-matches'),
    supabase.functions.invoke('sync-live-matches'),
  ]);
}, []);

// KALDIRILACAK KOD (satir 231-234):
if (matchesToShow.length === 0 && liveData.length === 0) {
  syncMatches(); // Bu cagri kaldirilacak
}
```

**Yeni Davranis:**
- Frontend SADECE database cache'den okuyacak
- pg_cron otomasyonuna guvenilecek
- Ilk acilista veri yoksa kullaniciya "Veri henuz senkronize edilmedi" mesaji

---

### Optimizasyon 2: Live.tsx Mount Sync Kaldirma
**Tahmini Tasarruf: 10-20%**

**Mevcut Sorun:**
```typescript
// Live.tsx satir 183-186
useEffect(() => {
  syncLiveMatches(); // Her mount'ta edge function cagiriliyor
}, []);
```

**Cozum:**
- `syncLiveMatches()` cagirisini kaldir
- Sadece cache'den oku
- pg_cron 15 dakikada bir guncelliyor

---

### Optimizasyon 3: Standings Sync Optimizasyonu
**Tahmini Tasarruf: 15-25%**

**Mevcut Sorun:**
```typescript
// Standings.tsx satir 75-94
if (triggerSync) {
  supabase.functions.invoke('sync-standings')...
}
```

**Cozum:**
- pg_cron saatlik sync yeterli
- Frontend'den sync cagrisini kaldir
- Sadece cache'den oku

---

### Optimizasyon 4: AI Analiz Cache Sistemi (En Buyuk Tasarruf)
**Tahmini Tasarruf: 20-40% AI maliyeti**

**Mevcut Sorun:**
- Ayni mac icin her kullanici ayri ml-prediction cagirisi
- AI Gateway pahalı (Gemini modeli)
- Tekrar eden analizler

**Cozum - Yeni Tablo:**
```sql
CREATE TABLE cached_ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_key TEXT UNIQUE NOT NULL, -- 'home_team-away_team-match_date'
  predictions JSONB NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '6 hours')
);

CREATE INDEX idx_cached_ai_match_key ON cached_ai_predictions(match_key);
CREATE INDEX idx_cached_ai_expires ON cached_ai_predictions(expires_at);
```

**Yeni Akis:**
```text
Kullanici Analiz Isteği
        |
        v
+-------------------+
| Cache Kontrol     |
| (match_key ile)   |
+-------+-----------+
        |
   +----+----+
   |         |
Cache Var  Cache Yok
   |         |
   v         v
Dogrudan  ml-prediction
Dondur    Edge Function
             |
             v
          Cache'e Kaydet
             |
             v
          Dondur
```

**Kod Degisikligi (mlPredictionService.ts):**
```typescript
export async function getMLPrediction(...): Promise<MLPredictionResponse | null> {
  // 1. Cache kontrol
  const matchKey = `${homeTeam.name}-${awayTeam.name}-${new Date().toISOString().split('T')[0]}`;
  
  const { data: cached } = await supabase
    .from('cached_ai_predictions')
    .select('predictions')
    .eq('match_key', matchKey)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (cached) {
    console.log('[ML] Cache hit for:', matchKey);
    return cached.predictions as MLPredictionResponse;
  }
  
  // 2. Cache yoksa AI cagir
  const { data, error } = await supabase.functions.invoke('ml-prediction', {...});
  
  // 3. Basarili ise cache'e kaydet
  if (data?.success) {
    await supabase.from('cached_ai_predictions').upsert({
      match_key: matchKey,
      predictions: data,
      home_team: homeTeam.name,
      away_team: awayTeam.name,
      match_date: new Date().toISOString().split('T')[0],
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'match_key' });
  }
  
  return data;
}
```

---

### Optimizasyon 5: Chatbot Benzet Soru Cache
**Tahmini Tasarruf: 10-20% AI maliyeti**

**Mevcut Sorun:**
- Ayni takim/lig icin benzer sorular tekrar AI'a gidiyor
- Ornegin: "Barcelona formu nasil?" gibi sorular

**Cozum - Basit Intent Cache:**
```sql
CREATE TABLE chatbot_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL, -- 'team1-team2-intent_type'
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour')
);
```

**Intent Bazli Cache Key:**
- Takim formu: `barcelona-form`
- Mac analizi: `barcelona-real_madrid-match`
- Lig analizi: `PL-standings`

---

### Optimizasyon 6: sync-standings Cron Azaltma
**Tahmini Tasarruf: 5-10%**

**Mevcut:** Saatlik (24 cagri/gun)
**Onerilen:** 6 saatte bir (4 cagri/gun)

Puan durumu gunluk 1-2 kez degisiyor, saatlik gereksiz.

```sql
-- Mevcut cron'u guncelle
SELECT cron.unschedule(3); -- sync-standings jobid

SELECT cron.schedule(
  'sync-standings-every-6h',
  '0 */6 * * *', -- Her 6 saatte
  $$
  SELECT net.http_post(
    url:='https://qqhvdpzidjqcqwikpdeu.supabase.co/functions/v1/sync-standings',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

## Dosya Degisiklikleri Ozeti

| Dosya | Islem | Detay |
|-------|-------|-------|
| `src/hooks/useHomeData.ts` | Duzenle | syncMatches fonksiyonunu ve cagirisini kaldir |
| `src/pages/Live.tsx` | Duzenle | Mount sync cagirisini kaldir |
| `src/pages/Standings.tsx` | Duzenle | triggerSync mantigini kaldir |
| `src/services/mlPredictionService.ts` | Duzenle | Cache kontrol ekle |
| `supabase/functions/ai-chatbot/index.ts` | Duzenle | Intent bazli cache ekle |

---

## Veritabani Degisiklikleri

1. **cached_ai_predictions** tablosu olustur
2. **chatbot_cache** tablosu olustur
3. sync-standings cron'u 6 saate guncelle
4. Eski cache temizleme cron'u ekle

---

## Beklenen Toplam Tasarruf

| Optimizasyon | Tahmini Tasarruf |
|--------------|------------------|
| Manuel sync kaldir | 30-40% edge function |
| Live.tsx sync kaldir | 10-20% edge function |
| Standings sync kaldir | 15-25% edge function |
| AI cache sistemi | 20-40% AI maliyeti |
| Chatbot cache | 10-20% AI maliyeti |
| Cron azaltma | 5-10% edge function |
| **TOPLAM** | **~40-60% Cloud Balance tasarrufu** |

---

## Uygulama Onceligi

1. **Yuksek Oncelik:** Manuel sync kaldir (useHomeData, Live, Standings)
2. **Orta Oncelik:** AI cache sistemi
3. **Dusuk Oncelik:** Chatbot cache ve cron optimizasyonu

