

# Beyaz Ekran ve Analiz Drawer Düzeltmesi

## Sorun 1: Beyaz Ekran
`TabShell` kullanıcı login olmadığında `null` döndürüyor (satır 89-92), aynı zamanda `App.tsx`'te tab route'ları `element={null}` olarak tanımlı. Sonuç: giriş yapmamış kullanıcı `/` rotasında beyaz ekran görüyor.

**Düzeltme:** `TabShell`'de `!user` durumunda `/auth` sayfasına yönlendirme ekle.

## Sorun 2: Analiz Drawer'a Crest Geçirilmiyor
`Index.tsx` `handleMatchSelect`'te `matchInput` objesi `homeTeamCrest` ve `awayTeamCrest` alanlarını içermiyor (satır 188-196). `AnalysisDrawer` bunları `analysis.input.homeTeamCrest` üzerinden okuyor ama değerler undefined.

**Düzeltme:** `handleMatchSelect`'te `matchInput` objesine `homeTeamCrest` ve `awayTeamCrest` ekle.

## Sorun 3: AnalysisDrawer Güvenlik Kontrolleri
Drawer, `analysis` null kontrolü yapıyor ama `isOpen && !analysis` durumunda sorun olabilir. `analysis` gelene kadar drawer açılmamalı.

**Düzeltme:** Drawer'da `if (!analysis) return null` kontrolünü `AnimatePresence` dışına taşı ve `isOpen` ile `analysis` ikisini birlikte kontrol et.

## Dosya Değişiklikleri

1. **`src/components/navigation/TabShell.tsx`** — `!user` durumunda `navigate('/auth')` çağır
2. **`src/pages/Index.tsx`** — `matchInput` objesine crest URL'lerini ekle
3. **`src/components/analysis/AnalysisDrawer.tsx`** — Null guard'ı düzelt, drawer kapanma animasyonunu iyileştir

