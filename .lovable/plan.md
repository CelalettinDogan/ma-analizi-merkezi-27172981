# Günün Skoru — Premium Dönüşüm Odaklı Yeniden Yapılandırma

## Mevcut Durum (Sorun)

`Günün Skoru` zaten `TodaysMatches.tsx` içinde küçük bir satır olarak kodlu, ancak:
- Veri kaynağı (`getSmartPicks`) yalnızca **kullanıcı tarafından önceden analiz edilmiş** tahminleri kullanıyor.
- Yeterli tahmin yoksa hata fırlatıyor → satır hiç render edilmiyor.
- Bugün ekranda görünmemesinin sebebi bu: DB'de uygun bir `predictions` kaydı yok.
- Görsel olarak da diğer maç satırları arasında kayboluyor — premium teaser olarak yeterince güçlü değil.

## Hedef

Günün Skoru'nu, anasayfanın **dikkat çeken bir bölümüne** çıkar; **her zaman dolu** olsun (yoksa otomatik seç); free kullanıcılar için bahis tipi/oran **bulanık** kalsın ve net bir CTA ile `/premium`'a yönlendirsin.

## Yapılacaklar

### 1) Veri tarafı — daima bir DailyPick olsun
`smartPicksService.ts` içine **fallback** ekle:
- Önce mevcut mantık (en yüksek `hybrid_confidence`'lı, henüz başlamamış tahmin).
- Tahmin yoksa: `cached_matches` içinden bugün/yarın oynanacak en "büyük" maçı (ör. en üstteki `TIMED` competition) seç ve **placeholder bir SmartPick** üret (predictionType/Value boş, hybridConfidence yok).
- Hata fırlatmak yerine `[]` dön; UI bunu yönetsin.

### 2) Yeni komponent — `DailyPickCard.tsx`
`TodaysMatches` içindeki gömülü satırı çıkar, ayrı bir komponent yap. `src/pages/Index.tsx`'te **HeroSection ile LeagueGrid arasına** yerleştir.

Tasarım (mevcut Emerald/Amber temasında, 8px grid, 16px radii):
- Amber gradient + parıltı (shimmer) animasyonu.
- Üst satır: `Sparkles` ikon + "Günün Skoru" + sağda gün etiketi (Bugün/Yarın).
- Orta satır: `EvSahibi vs Deplasman` + lig adı (küçük).
- Alt satır:
  - **Free**: tahmin tipi+değer ve %güven **blur(6px)** ile gösterilir, üstüne kilit ikonu + "Premium ile Aç" CTA butonu (tam genişlik, amber). Tıklayınca `/premium`.
  - **Premium**: net tahmin tipi+değer + güven yüzdesi (renk: ≥70 emerald, ≥50 amber, <50 muted) + "Maçı Analiz Et" butonu → maç analiz drawer'ını açar.
- Placeholder durumda (henüz analiz yok): aynı kart, alt satır yerine "Günün skoru hazırlanıyor — birkaç saat içinde açılıyor" mikro metni.

### 3) `TodaysMatches.tsx` temizliği
- `dailyPickRowEl`, `useQuery(['daily-top-prediction'])`, `Lock`/`Sparkles` importları, `showDailyDetail` state'i kaldır.
- Bileşen sadece günün maç listesine odaklansın.

### 4) i18n
5 dil (tr/en/de/es/ar) için `home.json` altındaki `dailyPick` bloğunu genişlet:
- `title`, `subtitle` (ör. "Yapay zekânın bugünkü en yüksek güvenli skoru")
- `unlockCta` ("Premium ile Aç")
- `analyzeCta` ("Maçı Analiz Et")
- `placeholder` ("Günün skoru hazırlanıyor")
- `today` / `tomorrow` etiketleri zaten var.

### 5) Premium tetikleyici (analytics)
`DailyPickCard` üzerindeki kilit CTA'sı `/premium`'a giderken `usePremiumPromotion` üzerinden `triggerLimitFeedback('daily_pick')` benzeri bir kaynak parametresi geçir, böylece premium ekranında "Günün Skoru'nu görmek için" başlığı gösterilebilir (opsiyonel — minik dokunuş).

## Dokunulan/Yeni Dosyalar

```text
+ src/components/home/DailyPickCard.tsx        (yeni)
~ src/services/smartPicksService.ts            (fallback + hata yerine boş dön)
~ src/components/TodaysMatches.tsx             (Günün Skoru çıkarıldı)
~ src/pages/Index.tsx                          (Hero altına DailyPickCard)
~ src/i18n/locales/{tr,en,de,es,ar}/home.json  (yeni metinler)
```

## Backend / DB

Şema değişikliği yok. Yeni edge function yok. Sadece istemci tarafı bir refactor + UX iyileştirmesi.

## Doğrulama

- Free kullanıcı: kart görünür, tahmin bulanık, CTA `/premium`'a gidiyor.
- Premium kullanıcı: kart görünür, tahmin net, "Maçı Analiz Et" drawer'ı açıyor.
- DB'de uygun tahmin yoksa: kart görünür, placeholder metin gösteriliyor, kart yine de tıklanabilir → free için `/premium`.
- Mobil 390px viewport'ta düzgün; safe-area, h-screen layout korunur.
