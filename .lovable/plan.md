

# Play Store Gerçek Fiyat Entegrasyonu

## Sorun
Tüm UI bileşenleri (`Premium.tsx`, `PremiumUpgrade.tsx`, `AnalysisLimitSheet.tsx`) hardcoded `PLAN_PRICES` sabitleri kullanıyor (₺49, ₺79, ₺99...). Google Play vergi eklediğinde kullanıcı farklı fiyat görüyor.

`purchaseService.getProducts()` zaten Google Play'den gerçek localized fiyatları çekebiliyor ama hiçbir UI bileşeni bunu kullanmıyor.

## Plan

### 1. Yeni Hook: `useStoreProducts.ts`
- `purchaseService.getProducts()` çağırarak Google Play'den gerçek fiyatları çeken bir React hook
- Sonuçları `productId → ProductInfo` map olarak cache'le (state'te tut, her mount'ta tekrar çekme)
- `getPrice(productId)` helper: localized price string döner (ör. "₺52,99/ay")
- `getPriceAmount(productId)` helper: sayısal değer döner
- Fallback: Native değilse veya henüz yüklenmediyse `PLAN_PRICES` sabitlerini kullan
- `purchaseService.initialize()` hook içinde çağrılsın (henüz init olmadıysa)

### 2. `Premium.tsx` Güncellemesi
- `useStoreProducts` hook'u ekle
- Plan kartlarında `₺{dp}` yerine `storeProducts.getPrice(productId)` kullan
- CTA'daki fiyat gösterimi de store'dan gelsin
- Yıllık planın aylık karşılığı hesabı da `getPriceAmount` ile yapılsın
- Loading state: fiyatlar yüklenirken skeleton göster

### 3. `PremiumUpgrade.tsx` Güncellemesi
- Aynı `useStoreProducts` hook'u ekle
- Plan kartları ve summary bölümünde store fiyatlarını kullan

### 4. `AnalysisLimitSheet.tsx` Güncellemesi
- `₺{PLAN_PRICES.premium_basic.monthly}/ay'dan başlayan fiyatlarla` satırını store'dan gelen en düşük fiyatla değiştir
- Hook'u drawer açıldığında kullan

### 5. `PurchaseButton.tsx` — Değişiklik yok
- Zaten `price` prop olarak dışarıdan alıyor, çağıran bileşen doğru fiyatı geçecek

### Teknik Detay
- `purchaseService.getProducts()` native'de Google Play'den, web'de fallback listesinden döner
- Hook, products'ı bir kez çeker ve component unmount'a kadar tutar
- `useEffect` ile `initialize()` + `getProducts()` sıralı çağrılır
- Fiyat string'i doğrudan Google Play'den gelir (ör. "TRY 52.99") — vergi dahil

**Toplam: 1 yeni dosya + 3 dosya değişikliği**

