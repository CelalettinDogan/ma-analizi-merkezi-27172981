

# Auth Sayfasi - Tam Ekran Native Responsive Duzeltme

## Sorun
Auth sayfasi `min-h-screen` ve sabit padding degerleri (`pt-12`, `pb-8`, `pb-6`) kullaniyor. Mobil uygulamada icerik viewport'u asiyor ve gereksiz scroll olusturuyor. Native bir uygulamada giris sayfasi tek ekrana sigmali ve scroll gerektirmemeli.

## Cozum
Sayfayi `h-[100dvh]` (dynamic viewport height) ile tam ekrana sabitleyelim, `overflow-hidden` ile scroll'u engelleyelim ve sabit padding'ler yerine dinamik spacing (`justify-between` / `gap`) kullanalim. Boylece her ekran boyutunda icerik otomatik olarak sigacak.

## Yapilacak Degisiklikler

### Dosya: `src/pages/Auth.tsx`

1. Ana container: `min-h-screen` yerine `h-[100dvh] overflow-hidden` kullanilacak
2. Logo bolumu: Sabit `pt-12 pb-6` yerine `py-4 xs:py-6 sm:py-8` gibi breakpoint bazli kucuk padding'ler
3. Logo boyutu: `w-20 h-20` yerine `w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20` dinamik boyut
4. Baslik: `text-3xl` yerine `text-2xl sm:text-3xl`
5. Ana icerik alani: `flex-1 overflow-y-auto` ile sadece form alani gerekirse scroll edilebilir (ama genelde gerekmeyecek)
6. Icerik padding: `pb-8` yerine `pb-4`
7. Divider margin: `my-5` yerine `my-3`
8. Form araliklari: `space-y-4` yerine `space-y-3` (daha kompakt)
9. Google butonu: `h-14 mb-6` yerine `h-12 mb-4`
10. Disclaimer: `mt-8` yerine `mt-4`

Bu degisikliklerle sayfa 320px'den 414px+'a kadar her ekran boyutunda scroll olmadan tek ekrana sigacak.

