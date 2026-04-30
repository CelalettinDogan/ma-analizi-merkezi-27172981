## "Gunun Skoru" Satirini Guncelle

### Degisiklik: `src/components/TodaysMatches.tsx`

Mevcut blurlu satiri kaldiracak, yerine temiz bir "Gunun Skoru" etiketli satir gelecek:

1. **Kapatilabilir satir**: "Gunun Skoru" yazisi + Sparkles ikonu amber renkli. Sagda:
   - Free kullanicilar: Kilit ikonu + "Premium ile Gor" + ChevronRight -> `/premium`'a yonlendirir
   - Premium kullanicilar: ChevronRight ok isareti -> tiklaninca detay acilir/kapanir

2. **Expandable detay (sadece premium)**: Tiklandiginda asagiya acilan panel:
   - Takim isimleri (Home vs Away)
   - Tahmin tipi ve degeri (orn. "Karsilikli Gol: Evet")
   - Lig, tarih ve guven yuzdesi

3. **State**: `showDailyDetail` useState ile toggle
4. **AnimatePresence** import'u eklenmeli (zaten dosyada yoksa)
5. Blur/overlay tamamen kaldirilacak, yerine temiz etiketli tasarim

### i18n Guncelleme
- `dailyPick.title`: "Gunun Skoru" (tr), "Daily Score" (en), "Tagestor" (de), "Gol del Dia" (es), "هدف اليوم" (ar)
