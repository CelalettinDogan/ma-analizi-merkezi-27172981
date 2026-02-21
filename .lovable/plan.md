

# Admin Paneli Lig Bazli Basari + Yanlis Fiyat Duzeltmesi

## Tespit Edilen Sorunlar

### 1. YANLIS FIYAT BILGISI (Kritik)
`useAdminData.ts` satir 247-251'de plan fiyatlari **yanlis**:
- Kodda: `basic: 29.99`, `plus: 49.99`, `pro: 79.99`
- Gercek fiyatlar (`accessLevels.ts`): `premium_basic: 49 TL`, `premium_plus: 79 TL`, `premium_pro: 99 TL`
- Ayrica plan key'leri uyusmuyor: Veritabaninda `premium_basic` olarak kayitli ama fiyat lookup `basic` arayor, dolayisiyla gelir her zaman 0 TL gosteriliyor.

### 2. Lig Bazli Basari Verisi Eksik
Admin panelinde sadece tahmin turune gore (Mac Sonucu, KG, Alt/Ust) basari gosteriliyor. Hangi liglerde daha iyi performans gosterildigi hic yer almiyor.

---

## Cozum Plani

### Dosya 1: `src/hooks/admin/useAdminData.ts`
**Fiyat duzeltmesi:**
- `accessLevels.ts`'den `PLAN_PRICES` import edilecek
- Hardcoded yanlis fiyatlar kaldirilip dogru fiyatlar kullanilacak
- Key eslesmesi duzeltilecek (`premium_basic` -> `premium_basic`)

**Lig bazli istatistik eklenmesi:**
- Yeni state: `leagueStats`
- Yeni fetch fonksiyonu: `fetchLeagueStats` -- mevcut `prediction_stats` view'i lig bazli veri vermiyor, bunun yerine `predictions` tablosundan direkt sorgulama yapilacak
- Tek bir GROUP BY sorgusu ile tum lig verileri cekilecek (cloud yuku minimum)

```text
Yeni interface:
interface LeagueStats {
  league: string;
  total: number;
  correct: number;
  accuracy: number;
}
```

### Dosya 2: `src/components/admin/AIManagement.tsx`
- Yeni prop: `leagueStats`
- Tabs icine 3. sekme: "Lig Bazli" eklenmesi
- Her lig icin basari orani, toplam tahmin ve progress bar gosterimi
- Lig kodlari icin Turkce isim eslesmesi (PL -> Premier Lig, BL1 -> Bundesliga, vb.)

### Dosya 3: `src/pages/Admin.tsx`
- `leagueStats` state'ini `AIManagement` componentine prop olarak gecirmek

---

## Cloud Balance Etkisi
- Tek bir SQL sorgusu ekleniyor (GROUP BY league), predictions tablosunda zaten index var
- Sayfa ilk yuklemesinde diger sorgularla paralel calisacak
- Realtime subscription veya polling YOK -- sadece manuel "Yenile" butonuyla tetiklenir
- Ek bir tablo veya view olusturulmuyor

## Degisecek Dosyalar Ozeti

| Dosya | Degisiklik |
|-------|-----------|
| `src/hooks/admin/useAdminData.ts` | Yanlis fiyatlari duzelt + `leagueStats` fetch ekle |
| `src/components/admin/AIManagement.tsx` | "Lig Bazli" sekmesi ekle + leagueStats prop |
| `src/pages/Admin.tsx` | `leagueStats` prop'unu AIManagement'a gecir |

