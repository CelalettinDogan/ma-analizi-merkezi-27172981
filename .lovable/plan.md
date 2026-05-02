# Kalan Çeviri Eksikleri – Tam Tamamlama Planı

## Tespit
Kodda hâlâ sabit Türkçe metin barındıran ve gerçekten kullanıcıya görünen alanlar:

### A. Analiz sonrası ekran (AnalysisDrawer ve alt bileşenler)
Drawer'ın kendisi büyük ölçüde çevrildi. Kalan görünür sızıntılar:
- `src/components/charts/ScorePredictionChart.tsx` → JSX yorumları zararsız ama eklenmemiş. *Görünür sızıntı yok* (sadece kontrol).
- `src/components/AnalysisSection.tsx`, `src/components/HeadToHeadCard.tsx`, `src/components/TeamStatsCard.tsx` → **hiçbir yerden import edilmiyor (legacy/ölü kod)**. Bunlar drawer mimarisinden önce kalan dosyalar. **Silinecek**, böylece "yarı çevrilmemiş" görünmeleri imkânsız hale gelir.
  - Not: `'yüksek' | 'orta' | 'düşük'` ve `'Karşılıklı Gol'`, `'Maç Sonucu'` gibi string literal'lar veri model anahtarıdır (DB'de bu şekilde saklanıyor) — kalacak; çeviri sadece UI etiketinde yapılır.

### B. Dashboard kartları (henüz hiç çevrilmemiş)
- `dashboard/StatsOverview.tsx` (Doğruluk Oranı, Doğru Tahminler, Yüksek Güvenli, "yanlış tahmin", "Henüz tahmin verisi bulunmuyor")
- `dashboard/RecentPredictions.tsx` (Başarılı/Hata toast'ları, "Sonuç Gir", "Maç Sonucunu Girin", "Henüz tahmin bulunmuyor")
- `dashboard/QuickStatsGrid.tsx` (Başarılı, Başarı Oranı, "Veri toplanıyor")
- `dashboard/PredictionTypePills.tsx` (etiket map'leri + "Tahmin Türleri", "Henüz tahmin verisi yok")
- `dashboard/PredictionTypeChart.tsx` ("Tahmin Türlerine Göre Başarı", "Henüz veri bulunmuyor", "doğru/yanlış")
- `dashboard/ActivityFeed.tsx` ("Kazandı/Kaybetti", "Tümünü Gör", "Tüm Tahminler", "Henüz tahmin yapılmadı", kısaltma map'i)
- `dashboard/AccuracyHeroCard.tsx` (Doğru/Yanlış, "Henüz Veri Yok", "AI Tahmin Başarı Oranı")
- `dashboard/AILearningBar.tsx` ("AI Öğrenmeye Hazırlanıyor", "AI Model Öğreniyor")
- `dashboard/MLPerformanceCard.tsx` ("Genel Başarı" vd.)
- `dashboard/AutoVerifyButton.tsx` ("Sonuç Bulunamadı", "Doğrulanıyor...", "Otomatik Doğrula", "AI Öğrenme Döngüsü")

### C. Premium / Rewards / Profil
- `pages/Premium.tsx` → `cleanPrice` regex (yıl/ay) → tüm dillerin son ek listesi zaten regex'te var, dokunulmaz; ama Türkçe hata mesajı kontrolleri (`'doğrulanamadı'` vd.) → değiştirilmez (server hata kodu).
- `components/premium/PremiumUpgrade.tsx` → aynı.
- `pages/Rewards.tsx` → "Plan Analiz Hakkı", "Plan Chat Hakkı", "Gün Serisi", "14+ gün seri ödülü"
- `components/streak/StreakRewardsCard.tsx` → fallback "gün"

### D. Küçük UI
- `components/ThemeToggle.tsx` (aria-label: "Tema değiştir", "Açık/Koyu temaya geç")
- `components/PullToRefresh.tsx` (aria-label: "Yenileniyor", "Yenilemek için çekin")
- `pages/Chat.tsx` → "Yükleniyor..." fallback
- `components/ShareCard.tsx` → renk eşleştirmedeki çoklu dil dizgileri zaten doğru, dokunulmaz.

### E. Auth.tsx — Gizlilik Politikası ve Kullanım Şartları
Modal içi tam blok metin Türkçe sabit. Bunlar yasal metin — uzun. **İki seçenek** (alttaki soru).

## Yapılacaklar

1. **Locale anahtarları ekle** – `dashboard.json` (yeni namespace), `common.json`, `profile.json`, `chat.json`, `rewards.json`, `legal.json`'a yeni anahtarlar; 5 dilin (TR, EN, DE, ES, AR) tamamına çeviri.
2. **`src/i18n/config.ts`** içine `dashboard` namespace'ini kaydet.
3. **Bileşenleri `useTranslation` ile güncelle** — yukarıdaki B/C/D listesindeki tüm dosyalar.
4. **Ölü kod sil**: `src/components/AnalysisSection.tsx`, `src/components/HeadToHeadCard.tsx`, `src/components/TeamStatsCard.tsx` (hiçbir yerden import edilmiyor — drv. doğrulandı).
5. **Doğrulama**: `rg -nP '[İıĞğŞşÇçÖöÜü]' src/components src/pages` çıktısı yalnızca; (a) veri model literal'ları (`'yüksek'`, `'Karşılıklı Gol'`), (b) JSX yorumları, (c) regex çoklu-dil pattern'lerinden ibaret kalacak.

## Soru: Auth.tsx içindeki Gizlilik & Şartlar metni

Bu yasal blok ~50 satır uzun bir Türkçe metin. İki yol:

- **A) Olduğu gibi bırak** — yasal metinler genelde tek resmi dilde tutulur (KVKK referansı dolayısıyla TR uygun). Diğer dillerde de TR gösterilir.
- **B) 5 dile çevir** — tutarlı görünüm; her dilin yasal anlamı muğlaklaşabilir.

Belirtmezseniz **A** varsayılır (sadece "Gizlilik Politikası" / "Kullanım Şartları" başlıklarını çevirir, içeriği TR bırakırım).

## Onay sonrası teslim
Onaylarsanız tek mesajda tüm değişiklikleri uygularım; ardından dil değiştirici ile EN/DE/ES/AR sırayla doğrulamanız için kısa bir kontrol listesi paylaşırım.
