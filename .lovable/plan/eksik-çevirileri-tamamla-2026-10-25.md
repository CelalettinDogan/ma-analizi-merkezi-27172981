# Eksik çevirileri tamamla

Kontrol sonucu: Türkçe metinlerde İngilizce karışıklık yok; TR, EN ve DE dosyaları eksiksiz. Yalnız İspanyolca ve Arapça'da Canlı sayfasındaki 5 metin eksik (bu dillerde İngilizce görünüyorlar).

## Yapılacak
İspanyolca ve Arapça'ya şu 5 metni ekle:
- Canlı Skorlar
- Puan durumu yükleniyor...
- Puan durumu yüklenirken hata oluştu
- Veriler ~15 dk gecikmeli olabilir
- Yaklaşan Maçlara Git

## Teknik
`es/home.json` ve `ar/home.json` içindeki `live` nesnesine `scoresTitle`, `standingsLoading`, `standingsError`, `delayNote`, `emptyCta` anahtarları eklenecek.
