

# GolMetrik AI — Denetim Raporu v4

---

## A) Genel Puan: 7.6 / 10

Hero section oncekinden daha iyi — kompakt, tek satir, alan israf etmiyor. Ama kullanicinin "bos kaldi" hissi dogru: accuracy badge gorunmuyorsa (<%65 veya 0 geldiyse) Hero alani sadece sag tarafta yesil "Mac Ara" butonu olan bos bir satir. Sol taraf tamamen bos kaliyor. Bu "minimalist" degil, "eksik" hissettiriyor.

---

## B) Alt Baslik Puanlari

| Kategori | Puan |
|----------|------|
| Gorsel kalite | 7/10 |
| Native hissi | 8/10 |
| Responsive guvenlik | 8/10 |
| Typography dayanikliligi | 8.5/10 |
| Bilgi hiyerarsisi | 6.5/10 |
| Etkilesim kalitesi | 7/10 |
| Premium/profesyonel gorunum | 7.5/10 |

---

## C) Guclu Yonler

1. Hero artik alan israf etmiyor — tek satir, above-the-fold maclar gorunuyor
2. Featured card gorsel olarak kaliteli — shadow-md, rounded-2xl, H2H badge, loading overlay
3. Match list satirlari okunabilir — crest w-5, text-sm, min-h-52px
4. Premium "Already Premium" sayfasi artik dolu ve bilgilendirici
5. BottomNav, TabShell, safe-area, overflow korumalari production-grade
6. 320px'de featured card artik "AC" / "FC" gosteriyor (tla) — onceki "A..." sorunu duzeltilmis
7. Hover kalintilari buyuk olcude temizlenmis

---

## D) Zayif Yonler

1. **Hero alani accuracy yokken bos gorunuyor.** Stats accuracy 0 veya <65 oldugunda sol taraf tamamen bos, sadece sag tarafta buton var. Gorsel olarak dengesiz, eksik hissettiriyor.

2. **AI kimligi hala kartlarda yok.** Featured card ve match list satirlarinda AI tahmin/guven preview'i yok. 4 denetimdir soyleniyor.

3. **Featured card'da takim isimleri "AC" ve "FC" olarak gorunuyor.** `tla` kullanimi kisa ama anonimize ediyor — AC Milan ve FC Internazionale yerine "AC" ve "FC" yazmak kullaniciya hicbir sey anlatmiyor. `tla` sadece 3 harfli kodlar icin anlamli (ARS, LIV, BAR). 2 harfli olanlar anlamsiz.

4. **Profil sayfasinda kullanici adi "05070506397b" gorunuyor.** Bu teknik bir sorun ama kullanici deneyimini vuruyor — sayfanin ilk izlenimi "kullanici ID gosteriyor" oluyor.

5. **Match list satirlarinda takimlar arasinda tire (-) cok soluk.** `text-muted-foreground/30` neredeyse gorunmuyor — hiyerarsiyi zayiflatiyor.

---

## E) Sert Elestiri

**Hero "minimalist" degil, "eksik".** Accuracy yokken Hero alani sadece saga dayali bir buton. Bu gorsel dengesizlik yaratir — native uygulamalarda her satirin bir amaci ve dengesi olmali. Cozum: accuracy yokken bile kullaniciya bir selamlama veya uygulamanin degerini gosteren bir mikro-mesaj koymak ("AI destekli mac analizi" gibi).

**tla sorununu cozmedik, yer degistirdik.** Onceden takim isimleri "A..." diye kesiliyordu, simdi "AC" ve "FC" yazıyor. Ikisi de kullaniciya anlamsiz. `tla` sadece 3+ karakter ve anlamli olduğunda kullanilmali, yoksa `shortName` tercih edilmeli.

**AI kimligi 4 denetimdir eksik.** Bu uygulama kendini "AI ile Analiz" olarak tanitiyor ama ana sayfada AI'in varligini gosteren TEK gorsel yok. `cached_ai_predictions` tablosu var ama kullanilmiyor.

---

## F) En Kritik 10 Iyilestirme

1. **Hero: accuracy yokken sol tarafa fallback icerik koy.** "AI destekli mac analizi" veya uygulama tagline'i. Bos kalmasin.

2. **Featured card: tla yerine shortName onceligi.** `shortName || tla || name` sirasi — "AC Milan" > "AC", "Inter" > "FC". tla sadece shortName yoksa fallback.

3. **Match list satirlari: ayni tla duzeltmesi.** shortName onceligi.

4. **Featured card ve match list: AI prediction preview ekle.** `cached_ai_predictions` tablosundan veri cekip "AI: Ev sahibi favori · %72" gibi bir satir goster.

5. **Match list satirlarinda tire rengini artir.** `text-muted-foreground/30` → `text-muted-foreground/50`.

6. **Featured card: elevation artir.** `shadow-md` zaten var ama border cok soluk — `border-border/30` → `border-border/50` ile gorsel siniri netlestir.

7. **Profil sayfasi: kullanici adi eksikse email'in @ oncesini goster.** `05070506397b` yerine email split ile daha okunabilir fallback.

8. **Premium sayfasi: feature grid ikonlari cok kucuk ve soluk.** Daha belirgin olabilir.

9. **BottomNav: "AI" labeli yetersiz.** Kullanicilar "AI"nin ne yaptigini label'dan anlayamiyor — "Asistan" veya "Chat" daha aciklayici olabilir. (Bu tercihe bagli.)

10. **Empty state (mac yok): gorsel iyilestirme.** Calendar ikonu + iki satir metin generic — daha branded bir empty state.

---

## G) Final Karar

**Iyi Indie App — Profesyonel Esiginde** (oncekiyle ayni, kucuk artisla)

Hero kompaktligi iyi hamle ama accuracy yokken bos kalma sorunu yaratti. tla duzeltmesi ise "AC" / "FC" gibi anlamsiz kisaltmalar uretti. Uygulama teknik olarak cok saglam ama bilgi hiyerarsisi ve AI kimligi hala zayif.

---

## Uygulama Plani

| Dosya | Degisiklik |
|-------|-----------|
| `src/components/HeroSection.tsx` | Accuracy yokken fallback tagline goster ("AI destekli mac analizi"); accuracy varken mevcut badge |
| `src/components/TodaysMatches.tsx` | tla → shortName onceligi (featured + list); tire rengini /50'ye cikart |

Bu iki dosya degisikligi en kritik gorsel sorunlari cozer. AI preview entegrasyonu ayri bir adim olarak planlanabilir cunku veri katmani (hook + query) gerektirir.

