

# Header Scroll Sorunu — Android'de Üst Menü Takip Etmiyor

## Sorun

Profile sayfası `h-screen flex flex-col` yapısı kullanıyor — header sabit kalıyor, sadece `main` kısmı scroll oluyor. Diğer sayfalar (Index, Live, Standings) ise `min-h-screen` kullanıyor ve header dahil tüm içerik birlikte scroll oluyor. `sticky top-0` Android WebView'da TabShell'in `overflowY: 'auto'` container'ı içinde güvenilir çalışmıyor.

## Çözüm

Tüm tab sayfalarını Profile ile aynı pattern'e geçir: `h-screen flex flex-col` + sadece main'de `overflow-y-auto`.

### Değişecek Dosyalar

**1. `src/pages/Index.tsx`** (~satır 274)
- Dış div: `min-h-screen` → `h-screen flex flex-col`
- `paddingBottom` style'ını kaldır (artık main'de olacak)
- Main içeriği `<main className="flex-1 overflow-y-auto">` ile sar
- `paddingBottom` style'ını main'e taşı

**2. `src/pages/Live.tsx`** (~satır 216-217)
- Aynı pattern: dış div `h-screen flex flex-col`, main'e `flex-1 overflow-y-auto` ekle
- `paddingBottom` style'ını main'e taşı

**3. `src/pages/Standings.tsx`** (~satır 132-133)
- Aynı pattern uygula

**4. `src/pages/Chat.tsx`**
- Kontrol edip gerekirse aynı pattern'e geçir

### TabShell Uyumluluğu

TabShell'deki `minHeight: '100vh'` ve `overflowY: 'auto'` artık gereksiz olabilir ama sayfalar kendi scroll'unu yönettiği için çakışma olmaz — sayfa `h-screen` olduğundan TabShell div'i taşmaz.

### Neden Bu Pattern?

Android WebView'da `position: sticky` + `overflow: auto` üst container = güvenilir değil. Header'ı scroll dışında tutmak (flex-col ile) her platformda çalışan sağlam bir çözüm.

