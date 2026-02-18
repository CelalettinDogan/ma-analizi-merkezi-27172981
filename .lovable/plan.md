

# Kayit Ol Ekrani Native Responsive + Cloud Balance Optimizasyonu

## 1. Auth Sayfasi - Tek Ekran Native Layout

### Sorun
`flex-1 overflow-y-auto` (satir 158) kullanildigi icin icerik ekrandan tastiginda scroll olusturuyor. Kayit Ol sekmesinde 3 input + checkbox + buton var ve kucuk ekranlarda tasiyor.

### Cozum
- `overflow-y-auto` yerine `overflow-hidden` kullanarak scroll'u tamamen engellemek
- Tum bilesenler icin dinamik boyutlandirma: `clamp()` veya daha agresif kompakt spacing
- Logo boyutunu kucuk ekranlarda daha da kucultmek (w-12 h-12)
- Google butonu ve divider'i daha kompakt yapmak
- Input yuksekliklerini `h-10` yapmak (h-11'den)
- Form spacing'i `space-y-2` yapmak (space-y-2.5'ten)
- Checkbox label font-size'i `text-xs` ile daha dar
- Alt disclaimer'i `text-[10px]` yapmak

### Dosya: `src/pages/Auth.tsx`

Degisiklikler:
- Satir 149: `overflow-hidden` korunacak (zaten var)
- Satir 151: Logo padding `py-2 xs:py-3 sm:py-6`
- Satir 152: Logo boyutu `w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20`, mb-1
- Satir 153-154: Baslik ve alt yazi arasindaki bosluk sifirlanacak
- Satir 158: `overflow-hidden` (scroll engelleme)
- Satir 162: Google butonu `h-10` (h-12'den)
- Satir 176: Divider margin `my-2` (my-3'ten)
- Satir 187: TabsList `h-10` (h-11'den)
- Satir 249: Register form `space-y-2 mt-2`
- Satir 260-290: Input'lar `h-10` (h-11'den)
- Satir 310: Checkbox label `text-xs leading-tight`
- Satir 322: Kayit Ol butonu `h-10` (h-11'den)
- Satir 329: Disclaimer `mt-2 pb-0 text-[10px]`

---

## 2. Cloud Balance Optimizasyonu

### Tespit Edilen Gereksiz Kullanimlar

#### A. useHomeData.ts - Realtime + Polling Cakismasi
Realtime subscription (satir 267-291) VE 5 dakikalik auto-refresh interval (satir 254-265) ayni anda calisiyor. Realtime zaten degisiklikleri anlik bildirdiginden, 5 dakikalik polling gereksiz.

**Cozum**: Auto-refresh interval'i kaldirmak. Realtime yeterli.

#### B. Live.tsx - 15 Saniye Polling
`fetchFromCache()` her 15 saniyede cagiriliyor (satir 186-193). Cache verisi zaten pg_cron tarafindan guncelleniyor. 15 saniye cok agresif.

**Cozum**: Polling interval'i 60 saniyeye cikarmak (15'ten).

#### C. Live.tsx - Manuel syncLiveMatches Fonksiyonu
`syncLiveMatches` fonksiyonu (satir 143-165) hala edge function cagirisi yapiyor. Sadece hata durumunda "Tekrar Dene" butonunda kullaniliyor ama gereksiz edge function cagrisi olusturabiliyor.

**Cozum**: Hata durumunda sadece cache'den tekrar okumak, edge function cagirmamak.

### Tahmini Tasarruf
- Realtime polling kaldirma: ~%20 daha az DB sorgusu
- Live page polling azaltma (15s -> 60s): ~%75 daha az DB sorgusu (Live sayfasinda)
- Manuel sync kaldirma: Sporadik edge function cagrilerinin onlenmesi

### Dosya Degisiklikleri

**`src/hooks/useHomeData.ts`**:
- Satir 254-265: Auto-refresh interval useEffect'i kaldirilacak

**`src/pages/Live.tsx`**:
- Satir 17: REFRESH_INTERVAL 15000 -> 60000
- Satir 143-165: syncLiveMatches fonksiyonu sadece fetchFromCache() cagracak (edge function cagrisi kaldirilacak)

