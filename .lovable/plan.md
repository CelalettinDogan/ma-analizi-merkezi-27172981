

# GolMetrik AI — Profesyonel Mobil UI/UX Denetim Raporu

---

## A) Genel Puan: 7.2 / 10

**Ozet:** Uygulama teknik altyapisi saglam, layout sistemi dogru kurulmus, font scaling korumalari yerinde. Ancak gorsel olarak "iyi bir indie app" seviyesinde — premium top-tier degil. Bazi alanlar hala template/webview hissi veriyor, bilgi hiyerarsisi zayif, ve AI odakli urun kimligini yeterince tasiyamiyor.

---

## B) Alt Baslik Puanlari

| Kategori | Puan | Aciklama |
|----------|------|----------|
| Gorsel kalite | 7/10 | Temiz ama flat, derinlik ve katman hissi zayif |
| Native hissi | 7.5/10 | Hover kalintilari temizlenmis, touch feedback var ama mikro-etkileşimler yetersiz |
| Responsive guvenlik | 8/10 | 320px'de bile kirilma yok, teknik olarak saglam |
| Typography dayanikliligi | 8.5/10 | textZoom:100 + CSS korumasi ile bulletproof |
| Bilgi hiyerarsisi | 6/10 | En zayif alan — featured card'da AI preview yok, kartlar sadece saat gosteriyor |
| Etkilesim kalitesi | 6.5/10 | whileTap var ama haptic feedback hissi yok, gecisler mekanik |
| Premium/profesyonel gorunum | 6.5/10 | "Zaten Premium" sayfasi bos beyaz alan, profil sayfasi generic |

---

## C) Guclu Yonler

1. **Teknik altyapi mukemmel.** TabShell mimarisi, h-screen + overflow-hidden, safe-area padding'ler, ErrorBoundary izolasyonu — bunlar production-grade.
2. **Font scaling tamamen korunmus.** textZoom:100 + CSS text-size-adjust ile Android'de font buyutme kaynaklı kirilma imkansiz.
3. **320px'de bile tasmia yok.** Truncation, min-w-0, flex-shrink-0 dogru kullanilmis.
4. **BottomNav kaliteli.** Skeleton fallback, layoutId animasyonu, optimistik cache — native seviyede.
5. **Renk paleti tutarli.** Primary green, secondary gold, muted tonlar sistematik.

---

## D) Zayif Yonler

1. **Featured match card'da AI bilgisi sifir.** Bu bir AI analiz uygulamasi ama featured card sadece takim + saat gosteriyor. "Analiz Et" CTA'si karar verme icin bilgi vermiyor. Kullanici neden tiklasin?

2. **"Zaten Premium" sayfasi felaket.** Ekranin %60'i bos beyaz alan, ortada tek bir kart. Native app'te bu kabul edilemez — bu sayfa kullaniciya deger saglamali (ozellik ozeti, istatistik, rozet).

3. **Profil sayfasi generic.** Buyuk avatar + isim + email kalıbı her template'de var. Analysis history listesi "hover:bg-muted/50" class'i hala var (web kalintisi). Kart icerisinde bilgi yogunlugu dengesiz.

4. **Hero section cok yer kapliyor.** Mobil ekranin %40'ini kaplayip sadece "Mac Sec, AI ile Analiz Yap" diyor. Kullanici zaten uygulamayi acmis, bunu biliyor. Above-the-fold iceriğe (maclar) yer kalmıyor.

5. **Lig secici'de "Lig Secin" label'i gereksiz.** Basligini kendi kendine anlatmak zorunda olmayan bir UI bileseninin ustune label koymak amatordur.

6. **Live sayfasinda "Lig Filtresi" + "Lig Secin" cift baslik.** Ayni sey iki kere soyleniyor.

7. **Match list satirlarinda takim isimleri cok kucuk.** `text-xs` ile 12px font, 4px crest icon'lari — mobilde okunabilirlik sinirda.

8. **Chat sayfasinda smart prompt chip'leri ekranin %15'ini kaplayip input'u asagi itiyor.** Kullanici mesaj yazmak istediginde chip'ler kaybolmuyor.

9. **Standings tablosu horizontally scrollable degil.** Dar ekranda "O", "Av", "P" sutunlari cok dar, takim isimleri truncate oluyor.

10. **Gecis animasyonlari yok.** Tab switch'lerinde sayfa aninda display:block/none ile degisiyor — hiç gecis yok. Native app'lerde en azindan fade-in var.

---

## E) Sert Elestiri

Bu tasarim neden 9/10 degil:

**AI kimliği yok.** Bu uygulama kendini "AI ile Analiz Yap" diye tanitiyor ama ana sayfada AI'in varligini gosteren TEK bir gorsel eleman yok. Mac kartlarina bakildiginda bu bir API'den mac saati ceken herhangi bir spor uygulamasi. Kullaniciyi AI analizine cekmek icin kartlarda en azindan "Inter favori - %72 guven" gibi bir preview olmali. `cached_ai_predictions` tablosu mevcut ama kullanilmiyor.

**Bos alan yonetimi zayif.** Premium sayfasi (premium kullanicida), Live sayfasi (mac yokken) ve profil sayfasinin alt yarisi bos beyaz alan. Native uygulamalarda bos alan "nefes almak icin" olur, burada ise "icerik yok" hissi veriyor.

**Mikro-etkilesimler mekanik.** whileTap scale:0.98 her yerde ayni — monoton. Farkli bilesenler icin farkli feedback turleri yok. Bir butonun press feedback'i ile bir kartinki ayni olmamali.

**Gorsel derinlik eksik.** Kartlar flat, golge yok denecek kadar az (shadow-sm). 2026 standartlarinda kartlarin "havada durma" hissi vermesi bekleniyor — subtle elevation hierarchy.

---

## F) Gelistirme Alanlari — En Kritik 10 Iyilestirme

1. **Featured match card'a AI preview ekle.** `cached_ai_predictions` tablosundan tahmin ozeti + guven yuzdesi cek, kart icinde "AI: Inter favori · %72" goster. Bu tek degisiklik uygulamanin AI kimligini %50 arttirir.

2. **Hero section'i %40 kucult veya kaldır.** Trust badge + CTA'yi header'a tasiyarak above-the-fold alani maclara birak. Kullanici uygulamayi actığında macları gormeli, marketing banner'ını degil.

3. **"Zaten Premium" sayfasını yeniden tasarla.** Bos sayfa yerine: ozelliklerin ozeti, kullanim istatistikleri, plan detaylari, abonelik yonetimi goster.

4. **Match list satirlarinda font boyutunu artir.** `text-xs` → `text-sm`, crest icon'larini `w-5 h-5` yap, satir yuksekligini `min-h-[52px]` yap.

5. **Live sayfasindaki cift baslik ("Lig Filtresi" + "Lig Secin") temizle.** Sadece bir tane yeterli.

6. **Profil sayfasindaki `hover:bg-muted/50` class'ini `active:bg-muted/30` ile degistir.** Web kalıntısı.

7. **Tab gecislerine fade animasyonu ekle.** TabShell'de display:block gecisinde 150ms opacity transition ekle.

8. **Kart elevation hiyerarsisi olustur.** Featured card: shadow-md, list items: shadow-none, modal: shadow-lg — net katman hissi.

9. **Standings tablosunu horizontal scroll yapilabilir yap.** Dar ekranlarda tablo iceriginin kesilmemesi icin ScrollArea ekle.

10. **Smart prompt chip'lerini input focus'ta gizle.** Chat input'a odaklanildiginda chip'ler animasyonla kaybolsun, alan kazanilsin.

---

## G) Final Karar

Bu tasarım su an: **Iyi Indie App** seviyesinde.

- Amatör degil — teknik altyapı saglam, tutarlı renk paleti var, responsive korunmuş.
- Profesyonel degil — bilgi hiyerarsisi zayif, AI kimligi gorsel olarak yok, bos alan yonetimi kalitesiz, mikro-etkilesimler monoton.
- Premium top-tier kesinlikle degil — gorsel derinlik, katman hissi, icerik yogunlugu ve kullanici yonlendirmesi bu seviyenin cok altında.

**7.2 → 9.0'a cikmak icin:** Yukaridaki ilk 5 madde uygulanırsa gorsel kalite ve bilgi hiyerarsisi ciddi sekilde atlar. Ozellikle AI preview entegrasyonu (madde 1) ve Hero section optimizasyonu (madde 2) tek basina 1+ puan arttirir.

