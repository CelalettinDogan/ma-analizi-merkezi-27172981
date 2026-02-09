
# Form Analizi Dinamik Fallback Duzeltmesi

## Sorun

Veritabanindaki `form` sutunu tum takimlar icin `NULL`. API bu veriyi saglamiyor. Sonuc olarak:
- Tum takimlar "0 puan" gorunuyor
- Form ikonlari (G/B/M) hic gorunmuyor
- Galibiyet/galibiyetsiz serileri hesaplanamıyor
- Sayfa tamamen statik ve bilgi vermiyor

## Cozum

`FormAnalysisTab.tsx` bileseninde `form` NULL oldugunda `won`, `draw`, `lost` verilerinden fallback hesaplama yapilacak.

### Degisiklikler

**Dosya:** `src/components/standings/FormAnalysisTab.tsx`

1. **Form puani fallback:** `calculateFormPoints` fonksiyonu form NULL ise `won*3 + draw*1` hesaplayacak (toplam puan)
2. **Siralama mantigi:** Form puani yerine "puan/mac" oranina gore siralama (daha adil karsilastirma)
3. **Form ikonu fallback:** Form verisi yoksa W/D/L sayilarina gore tahmini dagilim gosterilecek
4. **Galibiyet serisi:** Form NULL ise bu kartlar "Form verisi mevcut degil" mesaji gosterecek (yaniltici veri yerine)

### Teknik Detaylar

```text
Form NULL ise hesaplama:
- formPoints = (won * 3) + (draw * 1)
- pointsPerGame = formPoints / played_games
- Siralama: pointsPerGame'e gore (yuksekten dusuge)

Form Ikonu Fallback:
- won/draw/lost sayilarindan son 5 mac tahmini olustur
- Ornek: 17W 5D 3L -> oransal dagilim ile W,W,W,D,W gibi
```

| Dosya | Islem |
|-------|-------|
| `src/components/standings/FormAnalysisTab.tsx` | Fallback mantigi ekle |

Galibiyet/galibiyetsiz seri kartlari icin form verisi olmadigi icin gercek seri hesaplanamaz, bu yuzden bu kartlarda "Form verisi mevcut degil - genel performansa gore siralama gosteriliyor" mesaji gosterilecek.
