

# GolMetrik AI — Kapsamli UI/UX Denetim Raporu

---

## A) Genel Puan: 7.5 / 10

Onceki denetimden (7.2) kucuk bir artis var. Hero section daha kompakt hale geldi (iyi), ama bazi yeni sorunlar ortaya cikti. Genel olarak "iyi indie app" seviyesinin ust sinirinda — profesyonel esigine yakin ama henuz degil.

---

## B) Alt Baslik Puanlari

| Kategori | Puan | Aciklama |
|----------|------|----------|
| Gorsel kalite | 7/10 | Temiz ama hala flat, derinlik katmani yetersiz |
| Native hissi | 7.5/10 | Hover kalintilari buyuk olcude temiz, AppHeader'da `group-hover` hala var |
| Responsive guvenlik | 7.5/10 | 320px'de featured card team isimleri "A..." ve "F..." olarak kirilmis — okunmuyor |
| Typography dayanikliligi | 8.5/10 | textZoom:100 korunmus, font scaling guvenli |
| Bilgi hiyerarsisi | 6.5/10 | Hero artik daha iyi ama AI preview hala kartlarda yok |
| Etkilesim kalitesi | 7/10 | whileTap var, monoton scale degerleri devam ediyor |
| Premium/profesyonel gorunum | 7/10 | Premium "Already Premium" sayfasi cok iyilestirildi, profil sayfasi hala generic |

---

## C) Guclu Yonler

1. **Hero section artik kompakt.** Tek satir trust badge + CTA — alan israfı yok, above-the-fold'da maclar gorunuyor. Bu onemli bir iyilesme.
2. **Premium "Zaten Premium" sayfasi artik dolu.** Feature grid ile kullaniciya deger gosteriyor.
3. **BottomNav kaliteli.** layoutId animasyonu, skeleton fallback, safe-area padding — native seviyede.
4. **Standings tablosu temiz ve okunabilir.** Satir arakliklari iyi, puanlar vurgulu.
5. **Teknik altyapi saglam.** TabShell, overflow korumalari, ErrorBoundary izolasyonu yerinde.

---

## D) Zayif Yonler

1. **320px'de featured card kirilmis.** Screenshot'ta takim isimleri "A..." ve "F..." — kullanici hangi macin oldugunu anlayamiyor. `truncate` cok agresif.

2. **"Lig Secin" label'i hala gereksiz.** Onceki denetimde belirtilmisti, hem Ana sayfa hem Standings hem Live'da hala "Lig Secin" yaziyor. Self-explanatory bir chip listesine label koymak amatordur.

3. **AppHeader'da `group-hover:scale-105` ve `group-hover:opacity-100` hala var.** Web kalintisi — mobilde sticky hover state yaratir.

4. **AI kimligi hala gorsel olarak yok.** Kartlarda AI prediction/confidence preview yok. `cached_ai_predictions` verisi kullanilmiyor. Uygulama hala "saat gosteren spor uygulamasi" gibi.

5. **Hero'daki Shield icon + "%60" badge cok kucuk ve soluk.** Accuracy %60 ise bu vurgu icin zayif; %85+ ise gostermeye deger ama gorsel olarak yeterince one cikarilmiyor.

6. **Chat sayfasinda smart prompt chip'leri hala gorunuyor.** Input focus'ta gizlenmeleri gerektigi belirtilmisti.

7. **Live sayfasi bos durum kartinin gorsel kalitesi orta.** Buyuk yesil daire + "(o))" ikonu generic hissettiriyor.

---

## E) Sert Elestiri

**320px'de featured card kullanilmaz durumda.** "A..." vs "F..." yazan bir kart kullaniciya hicbir bilgi vermiyor. Bu tek basina responsive puanini 1 puan dusturuyor. Cozum: 320px altinda takim isimlerini `shortName` yerine sadece 3 harfli kisaltma goster, veya crest icon'larini buyutup ismi ikinci satira al.

**AI urun kimligi 3 denetimdir ayni yerde.** Her denetimde "kartlara AI preview ekle" dendi, hala eklenmedi. Bu uygulamanin #1 farklilastiricisi ve hala eksik.

**Monoton mikro-etkilesimler.** Her sey `scale: 0.98` veya `scale: 0.95`. Bir butonun feedback'i ile bir kartinki ayni — bu flat hissettiriyor.

---

## F) Gelistirme Alanlari — En Kritik 10 Iyilestirme

1. **Featured card 320px fix** — Takim isimleri kucuk ekranlarda okunabilir olmali. `min-w-0` + daha akilli truncation veya 2-satirli layout.

2. **AI preview'i kartlara entegre et** — `cached_ai_predictions` tablosundan veri cek, featured card'da ve match list satirlarinda goster. 3 denetimdir soyleniyor.

3. **"Lig Secin" label'ini kaldir** — Tum sayfalarda (Index, Live, Standings). Chip listesi kendi kendini anlatiyor.

4. **AppHeader hover kalintisini temizle** — `group-hover:scale-105` ve `group-hover:opacity-100` kaldir.

5. **Hero trust badge'i iyilestir** — Accuracy dusukse (<%70) gosterme, yuksekse daha vurgulu yap. Su an "%60" gostermek guvensizlik yaratir.

6. **Kart elevation hiyerarsisi** — Featured card: `shadow-md`, list items: `shadow-none/sm`, genel gorsel derinlik artirmasi.

7. **320px'de match list satir tasma kontrolu** — Uzun takim isimleri + iki crest + lig kodu + chevron dar ekranda sikisabiliyor.

8. **Chat smart prompt chip'leri input focus'ta gizlensin** — Onceki plan'dan kalan uygulama.

9. **Live bos durum kartini iyilestir** — Daha minimal, daha profesyonel empty state.

10. **Profil sayfasi analysis history'de hover class'i temizle** — `hover:bg-muted/50` → `active:bg-muted/30` (onceki plan'dan kalan).

---

## G) Final Karar

Bu tasarim su an: **Iyi Indie App — Profesyonel Esiginde**

Onceki denetimden ilerlemis: Hero kompaktlasti, Premium sayfasi iyilesti. Ama 320px'de featured card kirilmasi, AI kimliginin yoklugu ve hover kalintilari profesyonel seviyeye ulasmayı engelliyor.

**7.5 → 9.0 icin:** Yukaridaki ilk 4 madde (320px fix, AI preview, label temizleme, hover temizleme) uygulanirsa ciddi seviye atlar.

---

## Uygulama Plani

Yukaridaki tespitlere dayanarak su dosyalarda degisiklik yapilacak:

| Dosya | Degisiklik |
|-------|-----------|
| `src/components/HeroSection.tsx` | Trust badge: accuracy <%65 ise gizle, >=65 ise daha vurgulu goster |
| `src/components/TodaysMatches.tsx` | Featured card'da 320px-safe team name layout, match list satirlarinda AI confidence dot |
| `src/components/league/LeagueGrid.tsx` | "Lig Secin" label'ini kaldir |
| `src/components/layout/AppHeader.tsx` | `group-hover` CSS class'larini kaldir |
| `src/pages/Live.tsx` | "Lig Secin" label'ini kaldir |
| `src/pages/Standings.tsx` | "Lig Secin" label'ini kaldir |
| `src/pages/Profile.tsx` | `hover:bg-muted/50` → `active:bg-muted/30` |

