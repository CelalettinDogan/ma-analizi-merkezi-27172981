

# AI Asistan Upsell Ekrani - Yeniden Tasarim

## Ozet
PremiumGate bilesenini satin alma ekrani olmaktan cikarip, AI chatbot deneyimini tanitan bir upsell ekranina donusturuyoruz. Plan kartlari kaldirilacak, yerine blur efektli ornek chat preview ve AI odakli ozellik listesi gelecek.

## Tasarim Kararlari

**Neden plan kartlari kaldiriliyor?**
Bu ekran satin alma sayfasi degil, chatbot ozelliginin degerini gosteren bir tanitim ekrani. Kullanici "AI Asistani Ac" butonuyla Premium sayfasina yonlendirilecek.

**Neden chat preview?**
Kullaniciya "bunu kaciriyorsun" hissi veren somut bir ornek gostermek, soyut ozellik listesinden cok daha etkili bir ikna araci.

## Yapilacak Degisiklikler

### Dosya: `src/components/chat/PremiumGate.tsx`

Bilesenin tum icerigi yeniden yapilandirilacak:

1. **Header**: "AI Asistan" basligi korunacak, geri butonu kalacak

2. **Hero Alani** (ust kisim):
   - Bot ikonu
   - "AI Asistan" basligi
   - Slogan: "Sinursiz Yapay Zeka Mac Analizi"

3. **Chat Preview** (orta kisim):
   - Blur efektli (`backdrop-blur` + `overflow-hidden`) bir sahte chat baloncugu alani
   - Kullanici mesaji: "Fenerbahce - Galatasaray macini analiz et"
   - AI cevabi: "Fenerbahce son 5 mac icinde %72 galibiyet orani..." (kisaltilmis, blur ile kaybolan)
   - Bu alan premium deneyimi somutlastirir

4. **Ozellikler Listesi** (alt-orta):
   - 5 madde, dikey kompakt liste
   - Her biri ikon + tek satir:
     - Bot -> Sinursiz AI mac yorumu
     - BarChart3 -> Detayli istatistik aciklamalari
     - Shield -> Risk seviyesi analizi
     - Zap -> Canli mac icgoruleri
     - Star -> Reklamsiz deneyim

5. **CTA** (sabit alt):
   - "AI Asistani Ac" butonu (gradient, full width)
   - `/premium` sayfasina yonlendirme
   - "Daha Sonra" linki korunacak

## Teknik Detaylar

- Plan kartlari (`plans` dizisi ve grid) tamamen kaldirilacak
- `PLAN_PRICES` importu kaldirilacak
- `variant` prop'u korunacak ama chatbot varianti icin icerik tamamen farkli olacak
- Tum icerik `flex-col justify-center` ile tek ekrana sigacak, scroll olmayacak
- Chat preview alani `relative overflow-hidden` ile `mask-image: linear-gradient(...)` kullanarak alt kismi blur/fade edecek
- Responsive: kucuk ekranlarda gap ve font boyutlari `xs:` breakpoint ile ayarlanacak
- `pb-32` ile CTA alani icin bos alan birakilacak

