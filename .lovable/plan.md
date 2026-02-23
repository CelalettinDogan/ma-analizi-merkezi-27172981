
# Admin Kullanicilara Sinirsiz Analiz Hakki

## Sorun

`useAnalysisLimit.ts` hook'u admin kontrolu yapmiyor. `hasUnlimitedAnalysis(planType)` fonksiyonunu `isAdmin` parametresi olmadan cagiriyor, bu yuzden admin kullanicilar premium abonelikleri yoksa gunluk 2 analiz limitine takiliyorlar.

## Cozum

`useAnalysisLimit.ts` dosyasina `useUserRole` hook'unu ekleyip `isAdmin` bilgisini `hasUnlimitedAnalysis` fonksiyonuna iletmek.

## Teknik Degisiklik

| Dosya | Degisiklik |
|-------|-----------|
| `src/hooks/useAnalysisLimit.ts` | `useUserRole` import et, `isAdmin` bilgisini `hasUnlimitedAnalysis` ve limit hesaplamalarina ekle |

### Detay

1. `useUserRole` hook'unu import et
2. `isAdmin` degerini al
3. `hasUnlimitedAnalysis(planType, isAdmin)` olarak guncelle (3 yerde kullaniliyor)
4. `dailyLimit` hesaplamasinda admin icin 999 dondur
5. `isLoading`'e `roleLoading` ekle
