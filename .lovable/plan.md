

# Premium Yönlendirme ve Görünüm Düzeltmesi

## Sorun 1: Yanlış Yönlendirme

4 bileşen "Premium Planları Gör" butonunda `/profile` sayfasına yönlendiriyor, `/premium` yerine:

- `AnalysisLimitSheet.tsx` (satır 67)
- `AnalysisLimitBanner.tsx` (satır 43)
- `PremiumPromotionModal.tsx` (satır 65)
- `ChatLimitSheet.tsx` (satır 83)

**Düzeltme:** Hepsinde `navigate('/profile', { state: { openPremium: true } })` → `navigate('/premium')` olarak değiştirilecek.

## Sorun 2: Premium Sayfası Alt Metin Görünmüyor

Premium sayfasının alt kısmındaki "Şartlar ve Gizlilik" yazısı (satır 349-353) sabit CTA butonunun arkasında kalıyor. CTA `fixed bottom` pozisyonunda ve `calc(4rem + safe-area-inset-bottom)` ile konumlanıyor — ancak altındaki metin için yeterli alan bırakılmıyor.

**Düzeltme:** `<main>` elementinin `paddingBottom` değerini artırarak sabit CTA'nın altındaki içeriğin görünür kalmasını sağlamak. Ayrıca "Şartlar ve Gizlilik" metnini CTA bloğunun içine taşımak yerine (zaten orada — satır 349-353), CTA container'ının `pb` değerini `safe-area-inset-bottom` ile uyumlu hale getirmek.

## Değişecek Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/premium/AnalysisLimitSheet.tsx` | `/profile` → `/premium` |
| `src/components/premium/AnalysisLimitBanner.tsx` | `/profile` → `/premium` |
| `src/components/premium/PremiumPromotionModal.tsx` | `/profile` → `/premium` |
| `src/components/chat/ChatLimitSheet.tsx` | `/profile` → `/premium` |
| `src/pages/Premium.tsx` | CTA container `pb` düzeltmesi — `pb-2` → `pb-safe` veya padding artırımı |

