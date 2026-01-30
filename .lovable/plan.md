

# H2H Verileri Dinamik Hale Getirme Planı

## Problem Özeti

H2H (Geçmiş Karşılaşmalar) verileri şu anda **dinamik değil** çünkü:

1. **API çağrısı yapılmıyor**: `useMatchAnalysis` sadece veritabanından okuyor
2. **Veritabanı boş**: `cached_matches` tablosunda 0 FINISHED maç var
3. **Gerçek H2H endpoint'i kullanılmıyor**: `getHeadToHead(matchId)` fonksiyonu hiç çağrılmıyor

```text
Mevcut Akış (HATALI):
┌──────────────────────────────────────────────────────────┐
│ useMatchAnalysis                                          │
│   ↓                                                       │
│ getFinishedMatches(competitionCode, 365)                  │
│   ↓                                                       │
│ SELECT * FROM cached_matches WHERE status='FINISHED'      │
│   ↓                                                       │
│ [] (BOŞ ARRAY - çünkü hiç FINISHED maç yok!)             │
└──────────────────────────────────────────────────────────┘

Olması Gereken Akış (DOĞRU):
┌──────────────────────────────────────────────────────────┐
│ useMatchAnalysis                                          │
│   ↓                                                       │
│ getHeadToHead(matchId) → football-api Edge Function       │
│   ↓                                                       │
│ football-data.org/v4/matches/{id}/head2head               │
│   ↓                                                       │
│ Gerçek H2H verileri (son 10 maç)                         │
└──────────────────────────────────────────────────────────┘
```

---

## Çözüm Stratejisi

İki aşamalı çözüm uygulayacağız:

### Aşama 1: Geçmiş Maçları Senkronize Et (Arka Plan)
Yeni `sync-match-history` Edge Function ile son 90 günün FINISHED maçlarını veritabanına çekeceğiz.

### Aşama 2: Gerçek H2H API'sini Kullan (Anlık)
`useMatchAnalysis` hook'unu güncelleyerek `getHeadToHead` API'sini kullanacağız.

---

## Yapılacak Değişiklikler

### 1. Yeni Edge Function: `sync-match-history`

```text
supabase/functions/sync-match-history/index.ts
─────────────────────────────────────────────
- Tarih aralığı: Son 90 gün
- Ligler: PL, BL1, PD, SA, FL1, CL
- Rate limiting: 7sn bekleme
- Sadece FINISHED maçları kaydet
```

### 2. `sync-matches` Cleanup Güncellemesi

```text
Dosya: supabase/functions/sync-matches/index.ts

Satır 36-44 değişikliği:
────────────────────────
Önceki: .lt('utc_date', todayStart)
Sonraki: 100 günden eski maçları sil
```

### 3. `useMatchAnalysis` H2H Entegrasyonu

```text
Dosya: src/hooks/useMatchAnalysis.ts

Değişiklik:
────────────────────────
1. getHeadToHead import et
2. matchId varsa gerçek H2H API çağrısı yap
3. Yoksa cached verileri kullan
```

---

## Teknik Detaylar

### sync-match-history Edge Function

```text
Özellikler:
├── 6 lig için son 90 günün maçlarını çeker
├── Her API çağrısı arasında 7sn bekler (rate limit)
├── Sadece FINISHED status'lu maçları upsert eder
├── Günde 1 kez cron ile çalıştırılabilir
└── İlk çalıştırma: Tüm geçmişi doldurur
```

### useMatchAnalysis Güncellemesi

```text
Yeni akış:
1. Maç ID'si varsa:
   → getHeadToHead(matchId) çağır
   → Football-data.org API'den gerçek H2H al

2. Maç ID'si yoksa (manuel giriş):
   → getFinishedMatches ile cache'den al
   → Takım isimlerine göre filtrele
```

---

## Beklenen Sonuç

### Veritabanı Durumu (Değişiklik Sonrası)

| Durum | Maç Sayısı | Not |
|-------|------------|-----|
| TIMED | ~50 | Planlanmış maçlar |
| FINISHED | ~600+ | Son 90 günün maçları |

### H2H Görünümü

```text
Önceki:                          Sonraki:
┌─────────────────────────┐     ┌─────────────────────────┐
│ ⚔️ Geçmiş Karşılaşmalar │     │ ⚔️ Geçmiş Karşılaşmalar │
│                         │     │                         │
│ "Geçmiş karşılaşma      │     │ Arsenal   vs   ManCity  │
│  bulunamadı"            │     │    3       1       2    │
│                         │     │                         │
│                         │     │ Son Maçlar:             │
│                         │     │ 2-1 | 0-0 | 1-2 | 3-1   │
└─────────────────────────┘     └─────────────────────────┘
```

---

## Uygulama Sırası

1. **`sync-match-history` Edge Function oluştur**
   - Son 90 günün FINISHED maçlarını çeker

2. **`sync-matches` cleanup'ı güncelle**
   - 100 günden eski maçları sil

3. **`useMatchAnalysis` hook'unu güncelle**
   - Gerçek H2H API entegrasyonu

4. **Manuel tetikleme**
   - sync-match-history'yi bir kez çalıştır

5. **Test et**
   - Herhangi bir maç analizi yap
   - H2H Timeline'da veriler görünmeli

