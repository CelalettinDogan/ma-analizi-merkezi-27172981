

# Logo Arka Plan Düzeltmesi

## Sorun
Logo görseli (`src/assets/logo.png`) şeffaf arka plana sahip ve bu nedenle kareli (checkered) bir görüntü oluşuyor.

## Çözüm

**Dosya:** `src/components/layout/AppHeader.tsx`

Logo `<img>` elementine beyaz/solid arka plan rengi eklenecek:
- `bg-white` class'ı eklenerek şeffaf bölgeler beyaz ile doldurulacak
- Mevcut `rounded-xl` stili korunacak, böylece köşeler yuvarlak kalır

Tek satırlık değişiklik: `className`'e `bg-white` eklenmesi.

