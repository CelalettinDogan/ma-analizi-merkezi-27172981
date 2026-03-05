

# Analiz Drawer Full Mode İçerik Kesintisi Düzeltme

## Sorun
Drawer full modda `SNAP_FULL = 0.85` (viewport'un %85'i) kullanıyor. Native Android'de status bar, navigation bar ve Capacitor WebView'ın viewport hesaplaması nedeniyle kullanılabilir alan daha da küçülüyor. İçerik scroll container'ı `flex-1 overflow-y-auto` ile tanımlı ama drawer yüksekliği yeterli olmadığı için alt kısımlar ekran dışında kalıyor.

## Çözüm

### `src/components/analysis/AnalysisDrawer.tsx`
1. **SNAP_FULL değerini 0.85 → 0.93 yap** — Safe area'yı koruyarak drawer'ı neredeyse tam ekran aç
2. **Drawer height hesaplamasına safe-area desteği ekle** — `max-height` ile `env(safe-area-inset-top)` çıkararak native cihazlarda status bar ile çakışmayı önle
3. **Scroll container'a `-webkit-overflow-scrolling: touch`** ekle — iOS/Android WebView'da smooth scroll garantisi
4. **pb-32 → `paddingBottom: calc(2rem + env(safe-area-inset-bottom))`** — Alt içeriğin safe area altında kaybolmasını önle

### Değişecek Dosya
- `src/components/analysis/AnalysisDrawer.tsx` — SNAP_FULL artır, safe-area padding/height düzeltmeleri

