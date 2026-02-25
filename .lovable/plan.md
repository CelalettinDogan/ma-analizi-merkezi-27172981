

# Logo Kareli Arka Plan Düzeltmesi

## Mevcut Durum
`bg-white` class'ı `<img>` elementine eklenmiş ama kareli görüntü hâlâ devam ediyor. Bu muhtemelen PNG dosyasının şeffaf alanlarının `object-cover` ile düzgün render edilmemesinden kaynaklanıyor.

## Çözüm

**Dosya:** `src/components/layout/AppHeader.tsx`

Daha güçlü bir yaklaşım uygulayacağız:
1. Logo'nun sarmalayıcı `<div>`'ine de `bg-white rounded-xl overflow-hidden` ekle
2. `<img>` elementinde `object-cover` yerine `object-contain` kullan (logonun kesilmesini önler)
3. `<img>` üzerindeki `bg-white` korunsun

Bu şekilde hem container hem image seviyesinde beyaz arka plan sağlanarak şeffaflık tamamen kapatılır.

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/layout/AppHeader.tsx` | Container div'e bg-white, img'de object-contain |

