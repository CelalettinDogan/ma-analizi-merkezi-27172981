# İndirme ve Premium dönüşümünü artırma planı

## Mevcut durum (veritabanından)
- Toplam 136 kullanıcı, son 30 günde yalnızca 2 yeni kayıt.
- Son 7 günde analiz yapan aktif kullanıcı: 1.
- Ücretli aktif Premium: 0.

Sorun üç katmanlı: (1) Play Store'da az görünürlük, (2) kayıt sonrası kullanıcı geri gelmiyor, (3) Premium'un değeri satın alma anında net hissedilmiyor. Premium'dan önce asıl sorun elde tutma: geri gelmeyen kullanıcı ödeme yapmaz.

## 1. Uygulama içinde yapacaklarımız (kod)

**A. İlk deneyim ("aha" anı) — kayıt zorunluluğunu yumuşatma**
- Uygulama açılınca giriş ekranı yerine ana sayfa ve bir örnek maç analizi görünsün; kayıt, analiz/Arena/chat'e dokununca istensin. (Play Store'da "açtım, hemen kayıt istedi, sildim" en büyük kayıp nedeni.)
- 3 adımlı kısa onboarding: favori lig/takım seçimi, bildirim izni, ilk ücretsiz analiz.

**B. Geri getirme**
- Favori takımın maç günü yerel bildirimi ("Galatasaray maçı 2 saat sonra, analizin hazır").
- Arena: Pazartesi "yeni hafta başladı", maç önü "tahminini yapmadın" hatırlatması.

**C. Premium dönüşümü**
- 7 günlük ücretsiz deneme (Google Play deneme süresi) ve satın alma ekranında net vurgu.
- Paywall'u doğru anlarda göster: günlük analiz limiti dolduğunda, kilitli AI ipucuna/Joker'e dokununca, 3. günlük seride.
- Premium ekranında somut değer: "Son 30 günde Premium tahmin başarısı %X" (gerçek veriden), plan karşılaştırmasını sadeleştirme, yıllık planda indirim rozeti.
- Yeni kullanıcıya ilk 48 saatte tek seferlik "ilk ay indirimli" teklif (Play Console intro fiyatı ile).

**D. Değerlendirme ve tavsiye**
- Doğru tahmin/Arena başarısından sonra Google Play uygulama içi puanlama penceresi (In-App Review). Puan ve yorum sayısı mağaza sıralamasını doğrudan etkiler.
- Davet et kazan: davet linkiyle gelen her kayıt için iki tarafa +2 analiz hakkı.

**E. Ölçüm**
- Admin paneline dönüşüm hunisi: kurulum → kayıt → ilk analiz → 2. gün dönüş → paywall görüntüleme → satın alma. Hangi adımda kaybettiğimizi görmeden optimizasyon tahmin olur.

## 2. Senin Play Console'da yapman gerekenler (kod dışı)
- Mağaza başlığı/kısa açıklama anahtar kelimeleri: "maç tahmini", "futbol analiz", "iddaa istatistik" yerine uyumlu ifadeler ("futbol tahmin analizi", "maç istatistikleri AI").
- Yeni ekran görüntüleri (Arena, analiz ekranı, başarı oranı) ve kısa tanıtım videosu. İstersen görselleri ben hazırlarım.
- Custom store listing ile Türkçe/İngilizce ayrı sayfa; Store Listing Experiments ile A/B testi.
- 7 günlük deneme ve intro fiyatı abonelik ürünlerinde tanımlanmalı.

## Önerilen sıra
1. Ölçüm hunisi + misafir modu (A, E)
2. Paywall anları + deneme vurgusu + In-App Review (C, D)
3. Favori takım bildirimleri + davet sistemi (B, D)

## Teknik detaylar
- Misafir modu: TabShell auth guard'ı ana sayfa için gevşetilir; analiz/Arena/chat/profil aksiyonlarında `AuthPromptSheet` açılır. Sunucu tarafı sayaçlar (auth.uid) değişmez; misafir yalnızca önceden hesaplanmış örnek analizi görür.
- Huni: `app_events` tablosu (user_id nullable, anon device id, event, created_at), insert-only RLS; admin için toplu RPC.
- In-App Review: `@capacitor-community/in-app-review`, en fazla 90 günde bir.
- Davet: `referrals` tablosu, kod profilde; kayıt sonrası RPC ile ödül `streak_rewards` üzerinden (auth.uid, tek seferlik).
- Deneme/intro fiyatı Play Console'da tanımlanınca mevcut billing akışı `offerToken` ile seçer; yerel fiyat gösterimi korunur.
- Dil: olasılık dili, garanti yok; web ödemesi yok (Play uyumu).
