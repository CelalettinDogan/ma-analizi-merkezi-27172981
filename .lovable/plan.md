

# WebView Hissi Veren Sayfalar — Kapsamlı Audit

## Genel Değerlendendirme
Ana ekranlar (Index, Live, Chat, Standings, Profile, Premium) büyük ölçüde native hissiyata ulaşmış. Ancak **ikincil sayfalar** ve bazı **kalıntı web pattern'leri** hâlâ WebView hissi veriyor.

---

## Sorunlu Sayfalar ve Detaylar

### 1. `ResetPassword.tsx` — EN KÖTÜ (WebView skoru: 3/10)
- `min-h-screen` kullanıyor — TabShell dışında olduğu için sorun değil ama `Card` component'i tamamen web template
- `CardHeader`, `CardTitle`, `CardDescription` — generic web form kartı
- `hover:bg-primary/90` ve `hover:text-foreground` — web hover state'leri
- Input'lar standart — `pl-10` padding, border-based, premium styling yok
- `text-2xl` başlık — web ölçeğinde
- Touch target'lar küçük (şifre göster butonu `p-0`)
- Hiçbir mikro etkileşim yok (framer-motion sadece container'da)

### 2. `NotFound.tsx` — KÖTÜ (WebView skoru: 2/10)
- Tamamen minimal web sayfası — hiçbir brand öğesi yok
- `underline hover:text-primary/90` — klasik web link stili
- Logo, ikon, animasyon yok
- Native bir 404 sayfası gibi değil

### 3. `Privacy.tsx` ve `Terms.tsx` — ORTA (WebView skoru: 5/10)
- `min-h-screen pb-24` — BottomNav padding sabit, `calc()` kullanılmamış
- Back buton touch target'ı `h-9 w-9` — 36px, minimum 44px olmalı
- `Card > CardContent > p-6 prose` — web blog layout hissi
- `hover:underline` link'ler var (Privacy L129)
- Header yüksekliği `py-4` — native standartlarda `h-14` olmalı

### 4. `DeleteAccount.tsx` — ORTA (WebView skoru: 5/10)
- Aynı `min-h-screen pb-24` sorunu
- Back buton `h-9 w-9` — küçük touch target
- `hover:underline` link'ler var
- `Card` based layout — web template hissi

### 5. `AnalysisHistory.tsx` — ORTA (WebView skoru: 5/10)
- `min-h-screen pb-24` — sabit padding
- Back buton küçük touch target
- `Select` dropdown'lar web-native — native sheet olmalı

### 6. `Standings.tsx` — İYİ ama sorunlu noktalar (7/10)
- `hover:bg-muted/20` tablo satırlarında — web hover kalıntısı
- Radix `TabsList/TabsTrigger` — generic web tabs, custom segmented control olmalı (Premium ve Auth'daki gibi)

### 7. `Profile.tsx` — İYİ ama sorunlu noktalar (8/10)
- Settings butonlarında `hover:text-destructive hover:bg-destructive/10` — web hover kalıntısı
- `cursor-pointer` kullanımı (tema sheet) — mobilde gereksiz

### 8. `Premium.tsx` — İYİ ama bir sorun (8.5/10)
- CTA butonunda `hover:opacity-90` — web kalıntısı

---

## Yaygın Sorun Patternleri

| Sorun | Etkilenen Dosyalar |
|-------|-------------------|
| `hover:` state'ler | Standings, Profile, Premium, ResetPassword, NotFound, Privacy, DeleteAccount |
| `min-h-screen pb-24` (sabit padding) | Privacy, Terms, AnalysisHistory, DeleteAccount |
| Back buton < 44px | Privacy, Terms, AnalysisHistory, DeleteAccount |
| `Card/CardHeader/CardTitle` web template | ResetPassword, NotFound, Privacy, Terms, DeleteAccount |
| `cursor-pointer` | Profile |
| Radix TabsList (generic web tabs) | Standings |

---

## Uygulama Planı

### Tier 1 — Kritik (Web hissi çok belirgin)

**`ResetPassword.tsx`**: Card layout'u kaldır, Auth.tsx ile aynı premium input styling uygula (`rounded-2xl bg-muted/20 h-[52px]`), hover state'leri `active:` ile değiştir, `whileTap` ekle, touch target'ları 44px'e çıkar.

**`NotFound.tsx`**: Logo ekle, branded 404 tasarımı, `underline hover:` yerine `Button` component, animasyon ekle.

### Tier 2 — Orta (Tutarlılık sorunları)

**`Privacy.tsx`, `Terms.tsx`, `DeleteAccount.tsx`, `AnalysisHistory.tsx`**: 
- `pb-24` → `calc(80px + env(safe-area-inset-bottom))` 
- Back buton `min-w-[44px] min-h-[44px]`
- `hover:underline` → `active:opacity-70`
- Card wrapper'ları kaldır, doğrudan content render

### Tier 3 — İnce ayar

**`Standings.tsx`**: `hover:bg-muted/20` kaldır, Radix TabsList → custom segmented control (Auth.tsx'deki gibi)

**`Profile.tsx`**: `hover:text-destructive hover:bg-destructive/10` → `active:bg-destructive/10`, `cursor-pointer` kaldır

**`Premium.tsx`**: `hover:opacity-90` kaldır

**Toplam: 9 dosya değişiklik**

