# Arena: tam kontrol ve eksikleri kapatma

## Şu anki gerçek durum
- Hafta 1 açık, 5 maçın 4'ü bitti. 1 oyuncu, 2 tahmin, 0 ödül, 0 arkadaş ligi.
- Puanlama çok oyunculu sahte testte doğru çıktı, ama gerçek bir hafta sonu (ödül verme, yeni haftanın açılması) hiç yaşanmadı.
- Yani: kurulum hazır, gerçek kullanımla kanıtlanmadı.

## Yapılacaklar
1. **Hafta sonu provası**: Bitmiş 4 maçla bu haftanın puanlarını gerçek veriden hesaplayıp ekranla karşılaştır.
2. **Ödül ve yeni hafta testi**: Geri alınan bir deneme içinde haftayı "bitmiş" sayıp ilk 3'e ödülün bir kez verildiğini, ikinci açılışta tekrar verilmediğini ve yeni haftanın 5 maçla açıldığını doğrula.
3. **Kenar durumlar**: 5 maç bulunamayan hafta, ertelenen maç, beraberlikte sıralama, tek oyunculu hafta.
4. **Ekran kontrolü (telefon boyutu)**: Arena, sıralama, arkadaş ligi, paylaşım; 5 dilde taşma ve çeviri.
5. **Bulunan hataları düzelt**, sonuçları dürüstçe raporla.

## Teknik
- Sunucu fonksiyonları (`get_arena_week`, `arena_scored_picks`, ödül verme) için ROLLBACK'li SQL testleri; `arenaScoring.ts` ile eşleşme kontrolü.
- Playwright ile 393px görünümde oturum açık ekran testi.
- Gerekirse yeni vitest kuralları (beraberlik, ertelenen maç).
