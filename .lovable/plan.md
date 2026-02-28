

# Fix: Drawer İlk Açılışta Animasyon Çalışmıyor

## Kök Neden

`AnalysisDrawer`'daki double-`requestAnimationFrame` yaklaşımı güvenilir değil. TabShell'in `display: none → block` geçişi sırasında, tarayıcı çift rAF'ı tek frame'de batch'leyebiliyor — bu yüzden `translate-y-full → translate-y-0` transition'ı hiç tetiklenmiyor. Sayfa değişip geri gelince çalışıyor çünkü element zaten bir kez paint edilmiş oluyor.

## Çözüm

Double-rAF yerine **synchronous layout reflow** kullan. Drawer mount edildiğinde, bir `ref` üzerinden `element.offsetHeight` okuyarak tarayıcıyı zorla reflow yaptır, ardından `setVisible(true)` çağır. Bu %100 güvenilir — tarayıcı önceki `translate-y-full` state'ini paint etmek zorunda kalır, sonra transition tetiklenir.

## Dosya: `src/components/analysis/AnalysisDrawer.tsx`

1. Drawer container'a `useRef` ekle
2. `useEffect` içinde double-rAF'ı kaldır, tek rAF + forced reflow kullan:
   ```typescript
   if (isOpen && analysis) {
     setMounted(true);
     requestAnimationFrame(() => {
       drawerRef.current?.offsetHeight; // force reflow
       setVisible(true);
     });
   }
   ```
3. Cleanup'ta `raf2` cancelation bug'ını düzelt (şu an return value olarak yazılmış, işe yaramıyor)

Başka dosyada değişiklik yok — sorun tamamen drawer'ın mount-animate sıralamasında.

