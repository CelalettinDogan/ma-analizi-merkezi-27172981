

# AI Chatbot Ekranı — Tasarımsal Sorun Analizi & Düzeltme Planı

## Tespit Edilen Sorunlar

### A. Touch Target İhlalleri (WCAG AA / Material 3 — minimum 44px)
1. **Header geri butonu**: `w-8 h-8` = 32px — 44px altında
2. **Header 3-dot menü butonu**: `w-8 h-8` = 32px — 44px altında
3. **Match context X butonu**: `h-6 w-6` = 24px — ciddi ihlal
4. **Mesaj aksiyon butonları** (kopyala/beğen/beğenme): `p-1` = ~20px tap alanı
5. **Quick prompt pill'leri** (ChatInput): `py-1.5` = ~28px yükseklik, 44px altında

### B. Layout / Overflow Sorunları
6. **Badge'ler** (`h-4 text-micro`): %150 font scaling'de metin taşar, sabit `h-4` kırılır
7. **Quick prompt text**: `max-w-[130px] truncate` — metin kesilir, kullanıcı içeriği göremez
8. **WelcomeMessage**: `max-w-xs` (320px) — 414px ekranlarda gereksiz dar, boş alan israfı
9. **Header badge'leri**: Uzun plan isimleri + %150 font scale'de title satırı taşabilir

### C. Hiyerarşi / Native Feel Eksikleri
10. **"Yazıyor..." animasyonu** header'da: Title ile aynı satırda yarışıyor, okunması zor
11. **UsageMeter → ChatInput arası**: Görsel ayrım yok, iki bileşen birbirine yapışık
12. **Mesaj aksiyon butonları**: `onMouseEnter/Leave` kullanılıyor — mobilde güvenilmez, `onTouchStart` var ama `onTouchEnd` ile gizleme yok
13. **ScrollToBottomButton**: "Yeni mesaj" metni her zaman gösteriliyor ama yeni mesaj olmayabilir, sadece yukarı scroll yapılmış olabilir

### D. Responsive / Capacitor Uyumluluk
14. **GuestGate**: `min-h-screen` kullanıyor ama BottomNav TabShell'de her zaman render ediliyor — alt kısım BottomNav ile çakışabilir
15. **PremiumGate**: Fixed CTA `bottom: calc(64px + env(...))` — BottomNav'ın TabShell'den geldiği düşünülürse doğru, ama GuestGate'de bu koruma yok

## Düzeltme Planı

### 1. Touch Target Düzeltmeleri — `Chat.tsx`
- Header back button: `w-8 h-8` → `min-w-[44px] min-h-[44px]`
- Header menu button: `w-8 h-8` → `min-w-[44px] min-h-[44px]`
- Match context X button: `h-6 w-6` → `min-w-[44px] min-h-[44px]` (görsel ikon aynı kalır, tap alanı büyür)

### 2. Badge Overflow Fix — `Chat.tsx`
- Plan badge'lerinde `h-4` → `min-h-[16px] h-auto` yap, %150 scale'de taşmasın
- Title + badge satırını `flex-wrap` ile sarmala

### 3. Mesaj Aksiyon Butonları — `ChatMessage.tsx`
- `p-1` → `p-2` (tap area ~32px → 40px minimum)
- `onTouchStart` ile toggle yerine, mobilde tap-to-show/hide mantığı ekle
- Touch dışında tıklama ile de gizlenecek şekilde düzelt

### 4. Quick Prompt Touch Target — `ChatInput.tsx`
- Pill'lerdeki `py-1.5` → `py-2.5` (44px minimum yükseklik)
- `max-w-[130px]` → `max-w-[180px]` (daha fazla metin göster)

### 5. WelcomeMessage Responsive — `ChatContainer.tsx`
- `max-w-xs` → `max-w-sm` (wider on 414px screens)
- Quick prompt skeleton `h-14` yeterli

### 6. ScrollToBottom Label — `ChatContainer.tsx`
- "Yeni mesaj" → sadece aşağı ok ikonu (yanlış bilgi vermesin)

### 7. GuestGate BottomNav Clearance — `GuestGate.tsx`
- Content area'ya `pb-24` veya `paddingBottom: calc(80px + env(...))` ekle

### 8. Header "Yazıyor..." Konumu — `Chat.tsx`
- Status text'i header'dan çıkar, ChatContainer'ın üstüne veya TypingIndicator'a bırak (zaten var)
- Header'da sadece online dot yeterli

## Değişecek Dosyalar (6)
1. `src/pages/Chat.tsx` — Touch targets, badge overflow, header cleanup
2. `src/components/chat/ChatMessage.tsx` — Action button touch targets, mobile toggle
3. `src/components/chat/ChatInput.tsx` — Prompt pill touch targets, max-width
4. `src/components/chat/ChatContainer.tsx` — WelcomeMessage width, scroll button label
5. `src/components/chat/GuestGate.tsx` — BottomNav clearance padding
6. `src/components/chat/PremiumGate.tsx` — Minor: touch target kontrol (zaten iyi)

## Dokunulmayacaklar
- BottomNav yapısı
- Chat mesaj balonu tasarımı (radius, gradient)
- SSE/chatbot logic
- ChatLimitSheet (Drawer — zaten iyi)
- Renk paleti

