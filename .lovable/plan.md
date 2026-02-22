

# Chatbot Native Iyilestirme + Google Giris Hatasi Duzeltmesi

## 1. Google ile Giris Hatasi (Kritik)

**Sorun**: Gorseldeki hata: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`

Auth loglarinda da ayni hata gorunuyor: `missing OAuth secret` (400 hatasi).

**Neden**: `AuthContext.tsx` satir 69-82'de native platformda `supabase.auth.signInWithOAuth()` direkt olarak cagriliyor. Bu yontem, Supabase tarafinda manuel olarak Google OAuth client ID ve secret yapilandirilmasini gerektiriyor. Ancak bu projede Lovable Cloud yonetimli OAuth kullaniliyor -- yani `lovable.auth.signInWithOAuth()` kullanilmasi gerekiyor.

**Cozum**: Native platformda da `lovable.auth.signInWithOAuth()` kullanilacak. Native'de tarayici acildiginda OAuth tamamlandiktan sonra session otomatik olarak set edilecek. `supabase.auth.signInWithOAuth` kullanan native dalini kaldirip her iki platform icin de ayni Lovable Cloud yontemini kullanmak yeterli.

### Degisiklik: `src/contexts/AuthContext.tsx`
- `Capacitor.isNativePlatform()` dalindaki `supabase.auth.signInWithOAuth` kullanimini kaldirmak
- Her iki platformda da `lovable.auth.signInWithOAuth("google", ...)` kullanmak
- Native'de redirect_uri olarak deep link URL'si (`https://golmetrik.app/callback`) kullanilabilir, web'de `window.location.origin`

---

## 2. Chatbot Ekrani Native Iyilestirmeleri

Mevcut chatbot ekrani iyi durumda ancak su noktalar iyilestirilecek:

### 2a. Chat.tsx - Tam Ekran Native Layout
- `min-h-screen` yerine `h-[100dvh]` kullanmak (iOS/Android klavye acildiginda dogru davranir)
- `overflow-hidden` ekleyerek sayfa kaymasini onlemek
- `pb-24 md:pb-0` yerine `pb-safe` kullanarak BottomNav cakismasini her cihazda onlemek (chat sayfasinda BottomNav zaten gizli degil ama /chat route'u App.tsx'te HIDE listesinde olabilir -- kontrol edilecek)
- Header'da `pt-safe` zaten var, iyi

### 2b. ChatContainer.tsx - Responsive Welcome
- Welcome mesajindaki `max-w-xs` sinirlamasi kucuk ekranlarda (320px) tasabilir, `max-w-[85vw]` ile degistirmek
- `h-full` yerine `flex-1` ile welcome alaninin tum bos alani kaplamasini saglamak
- Smart prompt kartlarinin 320px ekranlarda daha iyi gorunmesi icin `gap-1.5` kullanmak

### 2c. ChatInput.tsx - Keyboard-Safe Input
- Input alanina `pb-safe` ekleyerek Android navigation bar ile cakismayi onlemek
- Send butonunun touch target'ini 44px minimum tutmak (zaten `h-11 w-11` = 44px, iyi)

### 2d. ChatMessage.tsx - Responsive Bubble Genisligi
- `max-w-[85%]` yerine `max-w-[min(85%,400px)]` kullanarak buyuk ekranlarda (tablet) asiri genis baloncuklari onlemek

---

## Degisecek Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | Native Google OAuth'u Lovable Cloud'a gecirmek |
| `src/pages/Chat.tsx` | `h-[100dvh] overflow-hidden` + `pb-safe` layout |
| `src/components/chat/ChatContainer.tsx` | Welcome ekrani responsive genislik |
| `src/components/chat/ChatMessage.tsx` | Bubble max-width tablet uyumu |
| `src/components/chat/ChatInput.tsx` | `pb-safe` ekleme |

## Degismeyecekler
- `useChatbot.ts` -- chatbot mantigi duzgun calisiyor
- `ai-chatbot` edge function -- dokunulmayacak
- `TypingIndicator`, `UsageMeter` -- mevcut haliyle iyi

