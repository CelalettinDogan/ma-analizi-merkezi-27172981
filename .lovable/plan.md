

# Maç Analiz Ekranı — 2026 Premium Seviye Yeniden Tasarım

## Mevcut Durum
Analiz ekranı (AnalysisDrawer) tüm bileşenleri dikey olarak sıralıyor: MatchHeroCard → AIRecommendationCard → PredictionPillSelector → TeamComparisonCard → H2HTimeline → AdvancedAnalysisTabs → LegalDisclaimer. Bilgi yoğunluğu yüksek, ilk ekranda karar verilebilir veri yok, hiyerarşi eksik.

## Mimari Değişiklikler

### 1. AnalysisDrawer — Gerçek Bottom Sheet Davranışı
- Touch-based drag handle ile snap points: %40 (peek) ve %85 (full)
- Peek modda sadece yeni "AnalysisHeroSummary" bileşeni görünür (karar verilebilir minimal veri)
- Yukarı sürükleyince veya "Detayı Gör" butonuyla %85'e snap
- `onTouchStart/Move/End` ile velocity-based snap logic
- Background blur (`backdrop-blur-xl`) ve elevation shadow

### 2. Yeni Bileşen: AnalysisHeroSummary (İlk Ekran)
Drawer peek modunda görünen karar kartı:
- Takım logoları + isimler (wrap destekli)
- Ana tahmin büyük font (örn: "Liverpool Kazanır")
- Hibrit güven skoru % ile circular progress + info tooltip (Poisson ağırlığı, Form ağırlığı, xG ağırlığı, Güç puanı etkisi açıklaması)
- Beklenen gol toplamı (xG toplam)
- En olası skor
- Micro fade-in + subtle progress animation
- "Detaylı Analiz" butonu → full snap

### 3. MatchHeroCard Güncelleme
- VS alanı adaptif küçülsün (küçük ekranda `w-8 h-8`)
- Takım isimleri `break-words` ile 2 satır wrap
- 16px kart radius, 12px iç element radius tutarlılığı
- 8pt grid spacing

### 4. AIRecommendationCard — Sadeleştirme
- Güven tooltip'i eklenmesi: % nasıl hesaplanıyor (Poisson, Form, xG, Güç puanı ağırlıkları)
- Mevcut yapı korunur, tooltip ile şeffaflık artırılır

### 5. TeamComparisonCard — İç Saha / Deplasman Ayrımı
- "Son 5 Maç" yerine "Son 5 İç Saha" ve "Son 5 Deplasman" sekmeli gösterim
- İç saha xG vs deplasman xG kıyaslama satırı eklenmesi
- Hücum/Savunma güç endeksi zaten mevcut, radar chart AdvancedAnalysisTabs'da var

### 6. AdvancedAnalysisTabs → CollapsibleAnalysis'e Geçiş
- Tab yapısı yerine accordion (CollapsibleAnalysis zaten mevcut) kullanılacak
- "Detayı Gör" başlığı altında tüm ileri analiz accordion ile açılacak
- Her section başlığında küçük badge (sayı/durum)

### 7. Güven Şeffaflığı Tooltip
- Yeni mikro bileşen: `ConfidenceBreakdownTooltip`
- Tooltip içeriği: Poisson ağırlığı, Form skoru, xG etkisi, Güç puanı oranları
- `@radix-ui/react-tooltip` kullanılarak implement

### 8. Responsive & Overflow Koruması
- Tüm takım isimleri `break-words min-w-0`
- VS alanı responsive (`w-8 md:w-12`)
- Metin taşması kontrolü tüm kartlarda
- 360dp + %150 font scale uyumlu

### 9. Renk & Stil Tutarlılığı
- Mevcut premium koyu-yeşil ana renk korunur
- Nötr arka plan (`bg-card`, `bg-muted`)
- 16px kart radius, 12px iç element radius
- 8pt spacing grid (p-4, gap-4, mb-4 vb.)

## Değişecek Dosyalar
1. `src/components/analysis/AnalysisDrawer.tsx` — Bottom sheet snap logic + peek mode
2. `src/components/analysis/AnalysisHeroSummary.tsx` — YENİ: Karar kartı
3. `src/components/analysis/ConfidenceBreakdownTooltip.tsx` — YENİ: Güven açıklama tooltip
4. `src/components/analysis/MatchHeroCard.tsx` — Responsive VS, wrap, spacing
5. `src/components/analysis/AIRecommendationCard.tsx` — Tooltip entegrasyonu
6. `src/components/analysis/TeamComparisonCard.tsx` — İç saha/deplasman ayrımı
7. `src/components/analysis/index.ts` — Yeni export'lar

## Dokunulmayacaklar
- Hero CTA butonları (Index sayfası)
- BottomNav
- Mevcut renk paleti
- Prediction/match type sistemi

