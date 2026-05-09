# Tahmin Başarı Oranı Neden Düştü?

DB üzerinde yaptığım incelemeye göre **modelin doğruluğu aslında düşmedi** — istatistiklerin hesaplanma şekli ve son haftalardaki birkaç popüler maç oranı yapay olarak aşağı çekiyor.

## Bulgular (gerçek veriler)

**Tüm zamanlar (her satır 1 tahmin sayılıyor — duplicate dahil):**
| Tip | Doğru/Toplam | Acc |
|---|---|---|
| Toplam Gol A/Ü | 175/256 | %68.4 |
| Karşılıklı Gol | 50/91 | %54.9 |
| Maç Sonucu | 16/36 | %44.4 |
| İlk Yarı | 3/9 | %33.3 |

**Aynı maç-tahmin kombinasyonu tekilleştirildiğinde:**
| Tip | Doğru/Toplam | Acc |
|---|---|---|
| Toplam Gol A/Ü | 68/108 | **%63** |
| Karşılıklı Gol | 15/26 | **%58** |
| Maç Sonucu | 11/16 | **%69** ← gerçekte yüksek |
| İlk Yarı | 3/5 | **%60** |

## Asıl sebep: Duplicate predictions

`predictions` tablosunda her kullanıcı analizi yeni satır oluşturuyor. Aynı maça aynı tahmin için **10 kopya** birikmiş örnekler var:

- Atlético–Arsenal (2.5 Alt): **10 satır**
- Leeds–Burnley (2.5 Üst): **9 satır**
- Bayern–Heidenheim: 8, Man Utd–Brentford: 7, Dortmund–Frankfurt: 7
- Bayern–PSG 1-1 (2.5 Üst — kaybeden): **4 satır**
- Everton–City 3-3 (2.5 Alt — kaybeden): **3 satır**
- Chelsea–Forest İY Beraberlik (kaybeden): **5 satır**

Sonuç: popüler maçlardaki tek bir kayıp, istatistiği N defa "kaybetmiş" gibi gösteriyor. Son 6 günün İlk Yarı %0 oranı **tamamen tek bir Chelsea–Forest maçından** (5 kopya) geliyor.

## İkincil sebep: Düşük örneklem + son haftadaki yüksek skorlu üst sürprizleri

- Maç Sonucu sadece 36 doğrulanmış tahmine sahip → küçük değişimler oranı çok oynatıyor
- 4–6 Mayıs aralığında üç sürpriz sonuç (Bayern–PSG 1-1, Sevilla–Sociedad 1-0, Everton–City 3-3) tek başına o haftayı %0–%50'ye çekti
- Önceki ve sonraki günler hâlâ %72–%100 aralığında

## Düzeltme planı

### 1) İstatistik tekilleştirmesi (ana fix)
`get_my_predictor_stats` ve admin dashboard sorgularını her maç-tahmin kombinasyonu için **bir kez** sayacak şekilde güncelle:
```sql
SELECT DISTINCT ON (home_team, away_team, match_date, prediction_type, prediction_value) ...
```
Bu tek başına Maç Sonucu oranını %44 → %69, BTTS %55 → %58, O/U %68 → %63 (gerçek oran) yapıyor.

### 2) Duplicate yazımını engelle
`predictions` tablosuna unique index:
```sql
CREATE UNIQUE INDEX predictions_unique_per_user_match
ON predictions (user_id, home_team, away_team, match_date, prediction_type);
```
ve insert tarafında `ON CONFLICT DO NOTHING`. Aynı kullanıcı aynı maçı tekrar analiz ederse yeni satır açmasın.

### 3) Trend grafiği için "rolling 14-day, dedup'lı" oran
Profil/Predictor kartında tek bir günlük dalgalanma yerine **14-günlük yuvarlanan ortalama** göster — küçük örneklem sapmalarını yumuşatır.

### 4) İlk Yarı Sonucu doğrulamasını gözden geçir
Chelsea–Forest 5 satırının HT verisi gerçekten "Beraberlik değil" miydi kontrol et; HT yoksa `null` (pending) bırakılmalı, yanlış/false işaretlenmemeli. `auto-verify/index.ts:161-168` mantığı doğru görünüyor ama 5 kayıt false işaretlendiğine göre HT verisi gelmiş ve Chelsea ya da Forest önde bitirmiş olabilir — log incelemesi gerek.

### 5) (Opsiyonel) Eski duplicate'ları temizle
Tek seferlik bir migration ile mevcut duplicate satırları (`(home_team, away_team, match_date, prediction_type, prediction_value)` üzerinde) en eski hariç sil.

## Teknik dosyalar

- `supabase/migrations/*` — yeni unique index + dedup view
- DB function `get_my_predictor_stats` — DISTINCT ON ile yeniden yaz
- `src/services/predictionService.ts` — insert'e ON CONFLICT
- `src/components/predictor/PredictorRankCard.tsx` ve admin dashboard — yeni dedup'lı RPC'yi kullan
- `supabase/functions/auto-verify/index.ts` — HT verisi denetiminin loglarını artır

## Beklenen sonuç

Düzeltmeler sonrası gerçek oranlar:
- Toplam Gol A/Ü: ~%63
- Karşılıklı Gol: ~%58
- Maç Sonucu: ~%69
- İlk Yarı: ~%60

Yani genel performans **düşmedi**; sadece istatistik motoru duplicate'lar yüzünden yanıltıcı raporluyordu.
