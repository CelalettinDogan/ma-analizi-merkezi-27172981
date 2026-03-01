

# Logo Değişikliği Planı

## Mevcut Logo Kullanım Noktaları

| Konum | Mevcut | Değişiklik |
|--------|--------|------------|
| **AppHeader.tsx** | `/lovable-uploads/d341d88c-...png` | Yeni logo ile değiştir |
| **Auth.tsx** | `@/assets/logo.png` import | Yeni logo ile değiştir |
| **AppFooter.tsx** | Gradient div + "GM" text | Yeni logo img ile değiştir |
| **public/favicon.png** | Eski favicon | Yeni logo ile değiştir |
| **public/apple-touch-icon.png** | Eski ikon | Yeni logo ile değiştir |
| **index.html** | Favicon referansları | Güncellenecek |

**Not**: GuestGate ve PremiumGate'deki `varioAvatar` AI asistan avatarıdır, uygulama logosu değil — dokunulmayacak.

## Yapılacaklar

1. **Yeni logoyu kopyala**: `user-uploads://` dosyasını `src/assets/logo.png` olarak kopyala (mevcut dosyanın üzerine yazılacak) ve `public/favicon.png`, `public/apple-touch-icon.png` olarak da kopyala
2. **AppHeader.tsx**: `src` attribute'unu `/lovable-uploads/...` yerine import edilen `logoImage`'a çevir, `bg-white` yerine `bg-transparent` yap (yeni logonun beyaz arka planı var)
3. **Auth.tsx**: Import zaten `@/assets/logo.png` — dosya değişince otomatik güncellenecek, sadece `rounded-2xl` stilini koru
4. **AppFooter.tsx**: "GM" gradient div yerine `<img>` ile yeni logoyu göster
5. **index.html**: Favicon referansını güncelle

Tüm logo gösterimleri `object-contain` kullanarak orijinal oranları koruyacak, `shadow-lg` ve `rounded-2xl` ile native mobil uyumlu görünüm sağlanacak.

