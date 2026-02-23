
# VARio - AI Asistan: Kapsamli Chatbot Yenileme Plani

## Degisiklikler Ozeti

### 1. Isim ve Marka Guncelleme
Tum "AI Asistan", "Gol Asistan", "GolMetrik AI Asistani" referanslari **"VARio - AI Asistan"** olarak guncellenecek.

Etkilenen dosyalar:
- `src/pages/Chat.tsx` -- Header basligi
- `src/components/chat/ChatContainer.tsx` -- Welcome mesaji ("Merhaba! Ben VARio, AI asistanin!")
- `src/components/chat/ChatMessage.tsx` -- Bot avatar'i (ikon yerine VARio gorseli)
- `src/components/chat/TypingIndicator.tsx` -- Bot avatar'i
- `src/components/chat/GuestGate.tsx` -- Basliklarda VARio
- `src/components/chat/PremiumGate.tsx` -- Basliklarda VARio
- `src/components/chat/ChatLimitSheet.tsx` -- Limit mesajinda VARio
- `src/components/chat/UsageMeter.tsx` -- Degisiklik gerekmeyebilir
- `supabase/functions/ai-chatbot/index.ts` -- System prompt: `Adin "VARio"`

### 2. Profil Fotografi (VARio Avatar)
- Kullanicinin yuklediyi robot gorseli `src/assets/vario-avatar.png` olarak kopyalanacak
- Tum `Bot` ikonu kullanan yerlerde (header, welcome, ChatMessage, TypingIndicator, GuestGate, PremiumGate) bu gorsel kullanilacak
- Gorsel `rounded-full` ve `object-cover` ile gosterilecek
- Bot avatar boyutlari mevcut boyutlarda korunacak (w-7 h-7, w-8 h-8, w-16 h-16 vb.)

### 3. Welcome Ekrani Guncelleme
`ChatContainer.tsx` icindeki `WelcomeMessage`:
- "Merhaba!" yerine "Merhaba! Ben VARio, AI asistanin!" 
- "Futbol analizleri icin buradayim" alt baslik korunacak
- Bot ikonu yerine VARio avatar gorseli

### 4. UI/UX Ince Ayarlar
- `ChatMessage.tsx`: Bot avatar'inda `Bot` ikonu yerine VARio gorseli
- `TypingIndicator.tsx`: Bot avatar'inda VARio gorseli
- `Chat.tsx` header: Bot avatar'inda VARio gorseli, baslik "VARio - AI Asistan"
- `GuestGate.tsx`: Baslik "VARio - AI Asistan'a Hos Geldin", ikon yerine VARio avatar
- `PremiumGate.tsx`: Baslik "VARio - AI Asistan", ikon yerine VARio avatar
- `ChatLimitSheet.tsx`: "Gunluk VARio mesaj hakkın doldu"

### 5. Edge Function System Prompt
`supabase/functions/ai-chatbot/index.ts` satir 162:
- `Adın "Gol Asistan"` -> `Adın "VARio"`
- Merhaba mesajlarinda "Merhaba ben VARio, AI asistanin" seklinde karsilik vermesi saglanacak

## Degisecek Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| `src/assets/vario-avatar.png` | Yeni dosya - robot gorseli kopyasi |
| `src/pages/Chat.tsx` | Header: VARio avatar + "VARio - AI Asistan" basligi |
| `src/components/chat/ChatContainer.tsx` | Welcome: VARio avatar + "Merhaba! Ben VARio" |
| `src/components/chat/ChatMessage.tsx` | Bot mesaj avatar: VARio gorseli |
| `src/components/chat/TypingIndicator.tsx` | Typing avatar: VARio gorseli |
| `src/components/chat/GuestGate.tsx` | VARio avatar + basliklarda VARio |
| `src/components/chat/PremiumGate.tsx` | VARio avatar + basliklarda VARio |
| `src/components/chat/ChatLimitSheet.tsx` | Limit mesajinda VARio ismi |
| `supabase/functions/ai-chatbot/index.ts` | System prompt: Adin "VARio" |

## Teknik Notlar
- Gorsel `src/assets/` altina kopyalanacak ve ES6 import ile kullanilacak (bundling optimizasyonu)
- Tum avatar kullanim noktalari `<img>` ile degistirilecek, `Bot` ikonu kaldirilacak
- Cloud yuku: Sadece edge function'da tek satirlik prompt degisikligi, ek sorgu yok
- Responsive: Mevcut boyutlar korunacak, gorsel `object-cover` ile her boyutta duzgun gorunecek
