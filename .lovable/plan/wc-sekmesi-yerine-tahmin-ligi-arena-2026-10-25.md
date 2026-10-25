# WC sekmesi yerine: "Tahmin Ligi" (Arena)

Dünya Kupası bitti. WC sekmesi, kullanıcıyı her gün geri getiren ve premium'a yönlendiren haftalık bir tahmin yarışmasına dönüşecek. Gerçek para yok, bahis yok: yalnızca puan, sıralama, rozet ve uygulama içi ödül.

## Kullanıcı ne görecek

1. **Haftalık Arena ekranı** (sekme adı: "Arena", kupa ikonu kalır)
   - Üstte yayın tarzı kart: "Bu hafta 5 maç seç, en çok puanı topla". Geri sayım, toplam katılımcı.
   - Seçilmiş 5 maç (popüler liglerden). Her maç için 1/X/2 ve Alt/Üst seçimi, maç başlayınca kilitlenir.
   - Puanlama: doğru sonuç 3, doğru Alt/Üst 2. Sürpriz sonuçta ek puan (az seçilen tahmin = daha çok puan).

2. **Sıralama**
   - Haftalık ve tüm zamanlar sıralaması, "arkadaşlarım" yerine "senin çevren" (üst/alt 3 kişi) görünümü.
   - Kullanıcının kendi sırası her zaman altta sabit görünür.

3. **Ödüller (elde tutma)**
   - Haftanın ilk 3'üne bonus analiz/chat hakkı ve özel rozet, ilk %10'a küçük rozet.
   - Mevcut seri (streak) sistemiyle bağlantı: Arena tahmini yapmak da günlük girişi sayar.
   - Maç sonuçlanınca yerel bildirim: "Tahminin tuttu, +3 puan, sıralamada 12 basamak yükseldin".

4. **Para kazandırma (premium dönüşüm)**
   - Ücretsiz: haftada 5 maç.
   - Premium: her maçın yanında "AI ipucu" (mevcut tahmin motorunun olasılığı), ek "Joker" (bir maçta puanı 2x), geçmiş hafta analizi.
   - Doğal anlarda premium daveti: kilitli AI ipucuna dokununca, ya da sıralamada ilk 10'u kıl payı kaçırınca.
   - Paylaşım kartı: "Bu hafta 5/5 bildim" görseli (mevcut paylaşım kartları altyapısıyla), yeni kullanıcı getirir.

5. **WC arşivi**: Arena'nın altında küçük "Dünya Kupası 2026 özeti" kartı (şampiyon, kullanıcının WC tahmin başarısı).

## Dil ve kurallar
- Olasılık dili; "kesin kazanç" yok. Ödüller yalnızca uygulama içi. 5 dilde çeviri.
- Mevcut koyu tema, Emerald/Amber, 8px düzen, alt menü korunur.

## Teknik detaylar
- Yeni tablolar: `arena_weeks` (hafta, seçili maç id'leri), `arena_picks` (user_id, match_id, picks, joker, points; maç başlayınca RLS ile değiştirilemez), `arena_leaderboard` görünümü. RLS + GRANT.
- Tüm puanlama sunucuda: auto-verify maç sonuçlanınca `score_arena_picks` çalıştırır; haftalık cron kazananlara `streak_rewards` benzeri bonus kredi yazar (auth.uid(), user_id parametresi yok).
- Haftalık maç seçimi cron: `cached_matches` içinden en popüler 5 maç.
- `/live` rotası Arena sayfasını gösterir; BottomNav etiketi "Arena". WC bileşenleri arşiv kartına indirgenir.
- Premium kontrolü mevcut `useAccessLevel` ile; joker/AI ipucu sunucuda da doğrulanır.
- Vitest: puanlama kuralları (3/2 puan, sürpriz bonusu, joker 2x, kilitleme) için testler.
