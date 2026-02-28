

# Fix: AnalysisDrawer İlk Açılışta Inline Görünüyor

## Kök Neden

AnalysisDrawer, `Index` bileşeninin içinde render ediliyor. `Index` ise `TabShell` içinde `display: none / block` ile toggle edilen bir div'in alt elemanı. `fixed` pozisyonlama ve `rAF` + reflow yaklaşımı bu yapıda güvenilir çalışmıyor -- ilk açılışta tarayıcı drawer'ı `translate-y-full` state'inde paint etmeden doğrudan `translate-y-0`'a geçiyor, bu yüzden transition tetiklenmiyor ve drawer aniden görünüyor.

Başka sekmeye gidip dönünce çalışıyor çünkü element zaten bir kez DOM'da paint edilmiş oluyor.

## Çözüm: React Portal

Drawer'ı `ReactDOM.createPortal` ile `document.body`'ye taşı. Bu sayede TabShell'in `display` toggling'inden tamamen bağımsız hale gelir. Portal, modal/drawer bileşenleri için standart React yaklaşımıdır.

## Dosya: `src/components/analysis/AnalysisDrawer.tsx`

1. `import { createPortal } from 'react-dom'` ekle
2. Return edilen JSX'i `createPortal(..., document.body)` ile wrap et
3. Mevcut rAF + reflow mantığını koru (portal içinde güvenilir çalışacak)
4. Double-rAF pattern'ına geç: dıştaki rAF paint'i garanti eder, içteki rAF'ta `setVisible(true)` çağrılır

```typescript
// Mevcut
return (
  <>
    {/* Backdrop */}
    ...
    {/* Drawer */}
    ...
  </>
);

// Yeni
return createPortal(
  <>
    {/* Backdrop */}
    ...
    {/* Drawer */}
    ...
  </>,
  document.body
);
```

Tek dosya değişikliği. Başka dosya etkilenmez.

