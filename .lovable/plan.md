

# Fix: Progress Bar %92'de Durma Sorunu

## Sorun
`AnalysisLoadingState` bileşeninde progress bar %92'ye ulaştıktan sonra tamamen duruyor (`if (prev >= 92) return prev`). Uzun süren analizlerde (ML edge function 10-20s sürebiliyor) kullanıcı donmuş gibi görüyor.

## Çözüm (`src/components/analysis/AnalysisLoadingState.tsx`)

Progress bar'ın %92'den sonra tamamen durmasını kaldır. Bunun yerine çok yavaş ama sürekli hareket eden bir mantık ekle:

```typescript
setProgress((prev) => {
  if (prev >= 98) return prev;           // Sadece %98'de dur (isComplete=true gelene kadar)
  if (prev >= 92) return prev + 0.1;     // %92-98: çok yavaş ama hareket var
  if (prev >= 85) return prev + Math.random() * 0.5 + 0.2;
  return prev + Math.random() * 2 + 1;
});
```

`displayProgress` cap'ini de güncellemek gerekiyor:
```typescript
const displayProgress = Math.min(Math.round(progress), isComplete ? 100 : 98);
```

Tek dosya, 2 satır değişikliği.

