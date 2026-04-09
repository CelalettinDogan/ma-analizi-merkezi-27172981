
## Plan: Premium Sayfa Scroll & CTA Düzeltmesi

### Sorun
Fixed CTA container (buton + yasal metinler) sayfanın alt kısmındaki içeriği (trust section, feature pills) örtüyor. Scroll yapıldığında içerik CTA arkasında kayboluyor çünkü `paddingBottom: 11rem` sabit değer her ekran boyutunda yeterli olmayabiliyor.

### Çözüm: CTA'yı scroll akışına taşı

Fixed positioning yerine CTA'yı scroll içeriğinin sonuna koy. Sayfa zaten kısa — kullanıcı doğal olarak aşağı kaydırarak CTA'ya ulaşır. Bu, tüm overlap sorunlarını ortadan kaldırır.

### Değişiklikler

**Dosya:** `src/pages/Premium.tsx`

1. **Fixed CTA container'ı kaldır** — `fixed left-0 right-0 z-40` div'ini scroll alanının içine taşı
2. **CTA'yı `<main>` içine al** — Trust section'dan sonra, scroll akışının doğal parçası olarak
3. **`paddingBottom`** değerini sadece BottomNav clearance'a düşür: `calc(80px + env(safe-area-inset-bottom))`
4. **CTA container stili**: fixed yerine sticky veya inline — `bg-background/95 backdrop-blur-xl` korunur, `pt-4 pb-4` padding ile
5. **`lg:hidden`** sınıfı kaldırılır — tüm ekranlarda görünsün

Tek dosya değişikliği. Fonksiyonalite aynı kalır.
