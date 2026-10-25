# Arena: doğrulama ve bağlılığı artırma

## Mevcut durum (dürüst değerlendirme)
- Temel işleyiş kurulu: haftalık 5 maç, 1/X/2 + Alt/Üst, kilitlenme, puanlama, joker, sıralama, ilk 3'e ödül, paylaşım.
- Gerçek kullanım neredeyse yok: şu ana kadar 1 oyuncu, 2 tahmin, verilmiş ödül 0. Yalnız bu hafta (19 Ekim haftası) oluşturuldu.
- Hafta sonu puanlama ve ödül dağıtımı gerçek veriyle hiç test edilmedi.
- Bağımlılık yapıcı unsurlar sınırlı: tek kişilik yarış, sosyal rekabet ve ilerleme hissi zayıf.

## 1. Önce sağlamlaştır
- Bu haftanın 5 maçı bitince puanlama ve sıralamanın doğru hesaplandığını kontrol et.
- Pazartesi yeni haftanın otomatik açıldığını ve ilk 3 ödülünün bir kez verildiğini doğrula.
- Birden fazla oyunculu sahte haftayla sıralama, beraberlik ve sürpriz bonusu testleri.

## 2. Tutucu ve bağımlılık yapıcı eklemeler
- **Canlı puan**: maç sürerken tahminin tutuyor mu, anlık puan ve sıralama değişimi.
- **Lig/rütbe sistemi**: Bronz, Gümüş, Altın, Elmas; haftalık yükselme/düşme.
- **Arkadaş ligi**: davet koduyla özel lig, arkadaşlar arası sıralama.
- **Arena serisi**: art arda katılım haftası, rozetler (ilk tam isabet, 5/5 hafta vb.).
- **Hafta sonu özeti**: "Bu hafta 12 puan, 34. sıradan 18.'ye çıktın" ekranı ve paylaşım.
- **Boş koltuk durumunda**: oyuncu azken sıralamanın boş görünmemesi için "topluluk ortalaması" ve VARio tahminiyle kıyas.

## Teknik
- Puanlama/ödül fonksiyonları için yeni testler; rütbe ve arkadaş ligi için yeni tablolar ve güvenlik kuralları.
- Canlı puan mevcut canlı maç verisini kullanır, ek API maliyeti yok.
