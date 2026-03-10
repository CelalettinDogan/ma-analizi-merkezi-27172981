

## Plan: Analiz Ekranı — 2026 Native Premium Revizyon

### Sorunlar

1. **AnalysisDrawer** — Peek modu %40 viewport yüksekliğinde, küçük ekranlarda (320px) içerik sığmıyor. Full modda drag handle + scroll çakışması var.
2. **MatchHeroCard** — Takım logoları ve VS badge'i dar ekranlarda sıkışıyor. Background dekor elementleri gereksiz GPU yükü.
3. **AIRecommendationCard** — Disclaimer bölümü görsel gürültü yaratıyor. Action butonları flex taşması riski.
4. **PredictionPillSelector** — Horizontal scroll hint gradient'i parent card rengiyle uyumsuz. Pill'ler dar ekranda okunaksız.
5. **TeamComparisonCard** — FormTabs içindeki grid dar ekranda form badge'leri kesiyor. ComparisonRow label'ları taşıyor.
6. **H2HTimeline** — Match bubble'ları 320px'de üst üste biniyor. Timeline çizgisi yanlış konumlanıyor.
7. **AnalysisHeroSummary** — Teams row'da uzun isimler taşıyor. Stat kutuları esnek değil.
8. **CollapsibleAnalysis** — Section header'ları hover efektli (web pattern), native'de active state olmalı.
9. **AnalysisLoadingState** — Skeleton cards grid 320px'de taşıyor.
10. **Drawer snap point** — `--app-height` kullanmıyor, `window.innerHeight` doğrudan kullanılıyor.

### Değişiklikler

**1. `src/components/analysis/AnalysisDrawer.tsx`**
- Snap point hesaplamasında `window.innerHeight` yerine CSS `--app-height` değerini kullan
- Peek snap'i %48'e yükselt (daha fazla hero summary alanı)
- Full modda drag handle ayrı, scroll container'ı bağımsız tut (touch event çakışmasını düzelt)
- `scrollRef`'e `onTouchStart/Move/End` bağlamayı kaldır — sadece drag handle'dan sürükleme
- Drawer border-radius'u `rounded-t-3xl` yap (daha premium)
- Close button boyutunu 44px minimum touch target'a yükselt

**2. `src/components/analysis/AnalysisHeroSummary.tsx`**
- Teams row'u `flex-wrap` ile sarmalı yap, uzun isimler için `truncate max-w-[120px]` ekle
- Stat kutuları (Güven, xG, Olası Skor) flex-wrap ile 320px'de alt satıra geç
- Confidence ring animasyonunu `will-change: stroke-dashoffset` ile optimize et
- "Detaylar için dokun" hint'ine subtle pulse yerine static chevron kullan (animasyon performansı)

**3. `src/components/analysis/MatchHeroCard.tsx`**
- Background dekor elementleri (blur-3xl divleri) kaldır, sadece gradient overlay bırak
- TeamLogo boyutlarını sabit `w-14 h-14` yap (md breakpoint farkını kaldır — native app her zaman mobil)
- VS badge boyutunu sabit `w-10 h-10` yap
- Insight badges'e `flex-wrap` ve `gap-1.5` ekle

**4. `src/components/analysis/AIRecommendationCard.tsx`**
- Action buttons container'ına `flex-wrap` ekle
- Disclaimer toggle button'a `active:bg-muted/20` native touch feedback ekle
- "Devamını oku" butonunu `active:` state'li yap
- Progress bar yüksekliğini `h-2` yap (daha ince, daha modern)

**5. `src/components/analysis/PredictionPillSelector.tsx`**
- Scroll hint gradient'ini `from-transparent` yerine `from-card/0 to-card` yap (parent card ile uyumlu)
- Pill padding'i `px-3.5 py-2.5` yap (daha büyük touch target, min 44px yükseklik)
- Expanded detail card'a `active:scale-[0.98]` touch feedback ekle

**6. `src/components/analysis/TeamComparisonCard.tsx`**
- Team header grid'i `grid-cols-[1fr_auto_1fr]` yap (VS label sabit genişlikte)
- FormBadge boyutlarını sabit `w-7 h-7` yap
- ComparisonRow label'larına `truncate` ekle
- FormTabs tab button'larına `active:scale-95` native feedback ekle

**7. `src/components/analysis/H2HTimeline.tsx`**
- Match bubbles container'ına `overflow-x-auto` ve `scrollbar-hide` ekle
- Bubble boyutlarını `w-11 h-11` sabit yap (küçült)
- Timeline çizgisini container'a göre dinamik konumla
- Ev/Deplasman indicator'larını kaldır (gereksiz, sonuç rengi yeterli)

**8. `src/components/analysis/CollapsibleAnalysis.tsx`**
- Section trigger'lardan `hover:bg-muted/30` kaldır
- `active:bg-muted/20 active:scale-[0.99]` native touch feedback ekle
- Section icon container'ını `w-9 h-9` yap (daha büyük touch target)

**9. `src/components/analysis/AnalysisLoadingState.tsx`**
- Skeleton cards grid'ini `grid-cols-3` yerine `flex overflow-x-auto gap-3 scrollbar-hide` yap
- Her skeleton card'a `min-w-[100px] shrink-0` ekle
- Shimmer animasyonu sayısını azalt (performans)

**10. `src/components/analysis/ConfidenceBreakdownTooltip.tsx`**
- Touch button boyutunu `w-6 h-6` yap (44px padding ile birlikte min touch target)
- `min-h-[44px] min-w-[44px]` touch area ekle

### Etkilenen Dosyalar

| Dosya | Değişiklik Türü |
|---|---|
| `src/components/analysis/AnalysisDrawer.tsx` | Snap point, drag handle izolasyonu, `--app-height` |
| `src/components/analysis/AnalysisHeroSummary.tsx` | Responsive wrap, truncate, animasyon opt |
| `src/components/analysis/MatchHeroCard.tsx` | Dekor temizliği, sabit boyutlar |
| `src/components/analysis/AIRecommendationCard.tsx` | Touch feedback, flex-wrap |
| `src/components/analysis/PredictionPillSelector.tsx` | Gradient fix, touch targets |
| `src/components/analysis/TeamComparisonCard.tsx` | Grid fix, touch feedback |
| `src/components/analysis/H2HTimeline.tsx` | Overflow scroll, boyut fix |
| `src/components/analysis/CollapsibleAnalysis.tsx` | Native touch states |
| `src/components/analysis/AnalysisLoadingState.tsx` | Skeleton responsive fix |
| `src/components/analysis/ConfidenceBreakdownTooltip.tsx` | Touch target büyütme |

UI tasarımında köklü değişiklik yok. Sadece responsive düzeltmeler, native touch feedback ve 320px+ uyumluluk iyileştirmeleri.

