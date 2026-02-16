

# Kayit Ol Sayfasi - Native Responsive ve Logo Duzeltme

## Sorun
- Kayit Ol sekmesi 3 form alani (isim, e-posta, sifre) + checkbox + buton iceriyor ve kucuk ekranlarda viewport'u asabiliyor
- Logo 1:1 kare oraninda zorlanmis degil, gorsel oranina bagli

## Yapilacak Degisiklikler

### Dosya: `src/pages/Auth.tsx`

1. **Logo 1:1 kare zorlama**: `aspect-square object-cover` eklenerek logonun her zaman kare gorunmesi saglanacak

2. **Logo bolumu daha kompakt**: `py-4 xs:py-5 sm:py-8` yerine `py-3 xs:py-4 sm:py-6` ile ust kisim daraltilacak, `mb-3` yerine `mb-2`

3. **Kayit formu araliklari**: `space-y-3` yerine `space-y-2.5` yapilarak form alanlari arasindaki bosluk azaltilacak

4. **Input yukseklikleri**: `h-12` yerine `h-11` ile input'lar biraz daha kompakt

5. **Label boyutlari**: `space-y-2` (label ile input arasi) yerine `space-y-1.5`

6. **Checkbox alani**: `pt-1` kaldirilarak daha kompakt

7. **Kayit butonu**: `h-12` yerine `h-11`

8. **Tab content margin**: `mt-4` yerine `mt-3`

9. **Disclaimer**: `mt-4 pb-2` yerine `mt-3 pb-1`

Bu degisikliklerle Kayit Ol sekmesi 320px ekranlarda bile scroll olmadan sigacak ve logo her zaman kare gorunecek.

