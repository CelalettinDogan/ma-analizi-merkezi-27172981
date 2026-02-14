
# BottomNav Anlık Titreme (Flash) Sorunu Cozumu

## Sorunun Kokeni

`useAccessLevel` hook'u uc async kaynaktan veri cekiyor:
- `usePlatformPremium` (premium durumu)
- `useUserRole` (admin rolu)
- `useAuth` (kullanici bilgisi)

Sayfa gecislerinde bu hook'lar yeniden calisir ve yukleme sirasinda `isPremium = false`, `isAdmin = false` olarak baslar. Bu da Premium sekmesinin anlik olarak gorunup kaybolmasina neden olur.

## Cozum

`BottomNav` bileseninde `isLoading` durumunu kontrol edip, yukleme tamamlanana kadar onceki nav yapisini korumak.

## Yapilacak Degisiklik

### Dosya: `src/components/navigation/BottomNav.tsx`

1. `useAccessLevel` hook'undan `isLoading` degeri de alinacak
2. `useMemo` icinde `isLoading` true iken onceki hesaplanmis deger korunacak (React `useRef` ile)
3. Boylece yukleme sirasinda nav yapisi degismeyecek, titreme olmayacak

Teknik yaklasim:
- Bir `useRef` ile son gecerli (loaded) nav items listesi saklanacak
- `isLoading` false oldugunda ref guncellenir ve yeni liste kullanilir
- `isLoading` true oldugunda ref'teki eski liste gosterilmeye devam eder
- Bu sayede sayfa gecislerinde anlik 6-5 sekme degisimi onlenir
