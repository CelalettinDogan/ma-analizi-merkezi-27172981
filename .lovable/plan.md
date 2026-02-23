

# Chat Mesaj Balonlari - Native Mobil Yeniden Tasarim

## Hedef

Mesaj balonlarini 2026 native iOS/Material 3 standardina yukseltmek. Web div hissiyatini ortadan kaldirip, WhatsApp/iMessage/Telegram kalitesinde bir chat deneyimi sunmak.

## Degisiklikler

### Dosya 1: `src/components/chat/ChatMessage.tsx`

**Balon Yapisi**

- Max genislik: `max-w-[80%]` (mevcut: `min(85%, 400px)`)
- Ic padding: `px-4 py-3` yani 16px/12px (mevcut: `px-3.5 py-2.5`)
- Border radius: `rounded-[20px]` (mevcut: `rounded-2xl` = 16px). Kullanici mesajinda sag ust kose `rounded-tr-md` (4px), AI mesajinda sol ust kose `rounded-tl-md` (4px) - kuyruk efekti
- Word-break: `word-break: normal` ile `overflow-wrap: anywhere` kombinasyonu. Boylece tek kelimeler harf harf bolunmez, ama cok uzun URL'ler yine de tasar
- Line-height: Tum metin elemanlari icin `leading-[1.5]`
- Shadow: Kullanici mesajina `shadow-md shadow-primary/8`, AI mesajina `shadow-sm shadow-black/5` (soft, native hissiyat)

**Kullanici Mesaji Stili**

- Gradient: `bg-gradient-to-br from-primary via-primary/95 to-emerald-600/90` - daha zengin yesil gradient
- Text renk: `text-primary-foreground`
- Kuyruk: Sag ust kose `rounded-tr-md`

**AI Mesaji Stili**

- Background: `bg-muted/60 backdrop-blur-xl` - daha soft, mat glass efekt
- Border: `border border-border/30` - cok hafif, neredeyse gorunmez
- Kuyruk: Sol ust kose `rounded-tl-md`

**Avatar Iyilestirmesi**

- Boyut: `w-8 h-8` (mevcut: `w-7 h-7`) - biraz daha buyuk
- Avatar ile balon arasi bosluk: `gap-2` (mevcut: `gap-2.5`) - daha yakin
- Dikey hizalama: `items-end` ile balonun alt kenarinda hizali (native chat stili)

**Saat Bilgisi**

- Font: `text-[10px]` (mevcut: `text-[9px]`)
- Opacity: `text-muted-foreground/60` (mevcut: `/50`)
- Konum: Balonun sag alt kosesine hizali (kullanici icin sag, AI icin sol)
- Margin: `mt-1 px-1`

**Markdown Stilleri (AI mesajlari)**

- Paragraf: `text-[13.5px] leading-[1.5]` (mevcut: `text-[13px] leading-relaxed`)
- Liste: `text-[13.5px]` tutarli boyut
- Basliklar: Hafif boyut artisi

### Dosya 2: `src/components/chat/ChatContainer.tsx`

**Mesajlar Arasi Bosluk**

- Wrapper `py-2` yi `py-1.5` yap (12px bosluk) (mevcut: `py-2` = 8px, ama gap ile birlikte)
- Ek olarak mesaj satirlari arasindaki padding'i `py-[5px]` ile ince ayarla (toplam ~10px mesaj arasi bosluk)

### Dosya 3: `src/components/chat/TypingIndicator.tsx`

- Avatar boyutu: `w-8 h-8` (ChatMessage ile tutarli)
- Balon stili: AI mesajiyla ayni `bg-muted/60 backdrop-blur-xl border border-border/30 rounded-[20px] rounded-tl-md`
- Gap: `gap-2`

## Teknik Detay

```text
// Balon stili ozeti
Kullanici: rounded-[20px] rounded-tr-md px-4 py-3 shadow-md shadow-primary/8
AI:        rounded-[20px] rounded-tl-md px-4 py-3 shadow-sm shadow-black/5

// Word-break stratejisi
style={{ wordBreak: 'normal', overflowWrap: 'anywhere' }}
// "normal" -> tek kelimeler bolunmez
// "anywhere" -> cok uzun stringler (URL) gerektiginde wrap olur
```

## Degisecek Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| `src/components/chat/ChatMessage.tsx` | Balon boyutlari, padding, radius, shadow, word-break, line-height, avatar boyutu, saat stili |
| `src/components/chat/ChatContainer.tsx` | Mesajlar arasi bosluk ayari |
| `src/components/chat/TypingIndicator.tsx` | Avatar boyutu ve balon stilinin ChatMessage ile tutarliligi |

