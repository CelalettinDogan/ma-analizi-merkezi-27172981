

# Tahmin Sistemi Tam Denetim Raporu

## 1. Tahmin Mantığı — Hangi Pazarlar Hesaplanıyor?

Sistem şu anda **5 pazar** için tahmin üretiyor:

| Pazar | Matematik (Poisson) | AI (Gemini) | Durum |
|-------|-------------------|-------------|-------|
| Maç Sonucu (1X2) | ✅ | ✅ | Aktif |
| Alt/Üst 2.5 | ✅ | ✅ | Aktif |
| Karşılıklı Gol (BTTS) | ✅ | ✅ | Aktif |
| Doğru Skor | ✅ (Poisson en olası skor) | ✅ | Aktif |
| İlk Yarı Sonucu | ✅ (%42 kuralı ile yarı-Poisson) | ✅ | Aktif |
| **İY/MS (HT/FT)** | ❌ | ❌ | **YOK** |
| **İlk Yarı Alt/Üst** | ❌ | ❌ | **YOK** |
| **Korner Alt/Üst** | ❌ | ❌ | **YOK — veri yok** |

Doğrulama sistemi (`checkPredictionCorrect`) İY/MS için kod içeriyor ama tahmin motoru bu pazarı hiç üretmiyor. İlk Yarı Alt/Üst ve Korner verileri mevcut API'den gelmiyor.

## 2. Kullanılan Metrikler

| Metrik | Kaynak | Kullanım Şekli |
|--------|--------|----------------|
| Takım formu (son 5 maç W/D/L) | football-data.org standings | Ağırlıklı form skoru (0-100) |
| Lig sıralaması & puan | standings API | Ev avantajı hesabı, bağlamsal analiz |
| Gol ortalaması (attığı/yediği) | standings API | Poisson beklenen gol |
| H2H geçmişi | H2H API + cached_matches | Psikolojik üstünlük |
| Hücum/Savunma güç endeksi | Hesaplanan (lig ortalamasına göre) | Poisson girdisi |
| Momentum (trend) | Form string'inden türetiliyor | AI prompt'una giriş |
| Derbi tespiti | Hardcoded eşleşme listesi | Güven düşürme |
| Maç önemi (şampiyonluk/düşme) | Sıralama pozisyonundan hesaplanan | AI prompt bağlam |
| Sezon fazı | Oynanan maç sayısından | AI prompt bağlam |
| Clean sheet oranı | Yenilen gol / maç | Insights kartı |
| Lig ortalamaları (ev/deplasman gol) | league_averages tablosu | Poisson kalibrasyonu |
| **xG (beklenen gol)** | ❌ Gerçek xG yok — Poisson expected goals proxy olarak kullanılıyor | |
| **Sakatlık/cezalı** | ❌ Veri yok, boş array döndürülüyor | |

Metrikler matematiksel olarak **Poisson-Dixon-Coles modeli** (ρ = -0.1) ile birleştiriliyor.

## 3. Model Tipi — **Hibrit Sistem**

```text
┌─────────────────────────────────────────────────┐
│                  VERİ GİRİŞİ                    │
│  Standings + H2H + League Averages + Context    │
└─────────────┬───────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
┌────────────┐    ┌──────────────┐
│ MATEMATİK  │    │   AI (LLM)   │
│  Poisson   │    │ Gemini 3     │
│ Dixon-Coles│    │ Flash Preview│
│ Form Skoru │    │ Tool Calling │
└─────┬──────┘    └──────┬───────┘
      │                  │
      ▼                  ▼
┌─────────────────────────────────┐
│    HİBRİT BİRLEŞTİRME          │
│  Dinamik ağırlıklar             │
│  (ml_model_stats'tan)           │
│  AI_weight = AI_acc/(AI+Math)   │
│  20+ sample threshold           │
│  Fallback: 40% AI + 40% Math   │
└─────────────┬───────────────────┘
              ▼
         TAHMİN ÇIKTISI
```

- **Katman 1**: İstatistiksel olasılık modeli (Poisson dağılımı + Dixon-Coles düşük skor düzeltmesi)
- **Katman 2**: LLM-tabanlı AI (Google Gemini, tool calling ile yapılandırılmış çıktı)
- **Katman 3**: Dinamik hibrit birleştirme (geçmiş performansa dayalı ağırlıklar)

Bu bir **klasik ML modeli değil**. Öğrenen bir sinir ağı yok. "ML" etiketi, LLM'in prompt'a dahil edilen geçmiş doğruluk verileriyle yönlendirilmesini ifade ediyor.

## 4. Makine Öğrenmesi Durumu

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Sonuçlar kaydediliyor mu? | ✅ | `predictions` tablosunda `is_correct`, `actual_result` saklanıyor |
| Tahminler gerçek sonuçla karşılaştırılıyor mu? | ✅ | `auto-verify` edge function saatlik çalışıyor (pg_cron) |
| Model yeniden eğitiliyor mu? | ❌ | Gerçek model eğitimi yok. LLM prompt'una geçmiş doğruluk bilgisi ekleniyor |
| Doğruluk takip ediliyor mu? | ✅ | `ml_model_stats` tablosunda AI ve Math ayrı ayrı takip |
| Ağırlıklar otomatik güncelleniyor mu? | ✅ | `getAIMathWeights()` her analizde güncel ağırlık hesaplıyor |

**Sonuç**: Sistem "sürekli öğrenen" değil, "sürekli adapte olan" bir sistem. Gerçek ML retraining yok ama geri bildirim döngüsü (feedback loop) mevcut.

## 5. Doğruluk Takibi

- **Depolama**: `ml_model_stats` tablosu (tahmin türüne göre), `predictions` tablosu (her tahmin için)
- **Hesaplama**: `accuracy_percentage = (correct / total) * 100`, AI ve Math bağımsız takip
- **Otomatik iyileşme**: Ağırlıklar doğruluğa göre kayar (daha doğru model daha fazla ağırlık alır)
- **Trend takibi**: `getAccuracyTrend()` son 7 günlük doğruluğu önceki 7 günle karşılaştırır
- **Premium filtresi**: `is_premium = true` olan yüksek güvenli tahminler ayrıca izlenir

## 6. Sistem En Yüksek Olasılıklı Tahmini Seçiyor mu?

**KISMEN.** `savePredictions()` fonksiyonu tüm tahminler arasından en yüksek hibrit güvene sahip olanı `is_primary = true` olarak kaydediyor. Ancak:

- Hibrit güven, olasılık değil bir güven skoru (0-1). "Over 2.5 = %63" gibi gerçek olasılık yerine "AI %72 güvenli + Math orta güvenli → hibrit %66" şeklinde hesaplanıyor.
- Tüm 5 tahmin kullanıcıya gösterilir, sadece kayıtta en yükseği "primary" seçilir.
- **Sorun**: Poisson'un hesapladığı gerçek olasılık (örn. Over 2.5 = %63) ile hibrit güven skoru (%66) farklı şeyler. Sistem gerçek olasılığa göre değil, güven skoruna göre sıralıyor.

## 7. Eksiklikler ve İyileştirme Önerileri

### A. Eksik Pazarlar
- **İY/MS (HT/FT)**: Poisson ile ilk yarı olasılıkları zaten hesaplanıyor (%42 kuralı). Bunları çapraz çarparak 9 kombinasyonun olasılığını üretmek mümkün.
- **İlk Yarı Alt/Üst**: Yarı-Poisson beklenen golleri zaten mevcut. Goal line olasılıkları türetilebilir.

### B. Olasılık Tabanlı Sıralama (Kritik İyileştirme)
Mevcut "hibrit güven" yerine her tahmin için **gerçek olasılık değeri** kullanılmalı:
- Match Result: Poisson olasılığı (örn. %54)
- Over 2.5: Poisson over2.5 olasılığı (örn. %63)
- BTTS: Poisson BTTS olasılığı (örn. %47)
- Primary prediction = en yüksek gerçek olasılık

### C. AI Modeli İyileştirmesi
- Mevcut: LLM prompt'a geçmiş doğruluk bilgisi ekleniyor (zayıf feedback)
- Öneri: Her tahmin türü için Poisson olasılığını AI'a "hard constraint" olarak ver, AI sadece ince ayar yapsın (±%5-10 marjla)

### D. Gerçek ML Öğrenme Eksikliği
- `prediction_features` tablosunda yeterli veri birikmiş durumda (form skoru, güç endeksleri, Poisson beklentileri, sonuç)
- Bu verilerle basit bir lojistik regresyon veya gradient boosting modeli eğitilebilir
- Ancak bu, edge function'da çalıştırılamaz — model ağırlıkları periyodik olarak hesaplanıp DB'ye yazılmalı

### E. Dixon-Coles Rho Değeri
Mevcut sabit ρ = -0.1 değeri tüm maçlar için aynı. İdeal durumda lig bazında farklı ρ değerleri hesaplanmalı.

## Önerilen İyileştirme Planı

### Faz 1: Olasılık Tabanlı Primary Selection (Yüksek etki, düşük efor)
- Her prediction'a `probability` alanı ekle (Poisson'dan gelen gerçek olasılık)
- Primary selection'ı `hybridConfidence` yerine `probability` değerine göre yap
- Kullanıcıya "En güçlü tahmin: Over 2.5 (%63)" şeklinde göster

### Faz 2: Eksik Pazarları Ekle (Orta efor)
- İY/MS: Poisson ilk yarı × maç sonu çapraz çarpım (9 kombinasyon)
- İlk Yarı Alt/Üst: Yarı-Poisson'dan goal line olasılıkları
- AI prompt'una yeni pazarları ekle

### Faz 3: Gerçek ML Modeli (Yüksek efor)
- `prediction_features` verisinden logistic regression ağırlıkları hesapla
- Haftalık cron job ile model ağırlıklarını güncelle
- Edge function'da inference (çarpma/toplama) yap

Hangisine odaklanmamı istersiniz?

