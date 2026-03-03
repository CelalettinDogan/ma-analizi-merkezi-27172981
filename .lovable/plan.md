

# Samsung %150 Font Scaling — Layout Koruma

## Sorun
Android cihazlarda sistem font ölçeklendirmesi (%150) uygulandığında, sabit yükseklikli bileşenler taşıyor ve layout kırılıyor. `text-size-adjust` koruması henüz uygulanmamış.

## Yaklaşım
Kullanıcının talimatına birebir uyarak **minimal, cerrahi** düzeltmeler yapılacak. Hero, CTA butonları ve tablo spacing'e dokunulmayacak.

## Değişiklikler

### 1. `src/index.css` — Global güvenlik kuralları
- `html` elementine `-webkit-text-size-adjust: 100%; text-size-adjust: 100%` ekle
- `body`'ye `overflow-x: hidden` ekle
- `*` seçicisine `min-width: 0` ekle (flex/grid taşma koruması)

### 2. `src/components/ui/button.tsx` — Icon button sabit yükseklik düzeltmesi
- `icon` size varyantında `h-10 w-10` → `min-h-[40px] min-w-[40px] h-auto w-auto` yap
- `sm` size'da `h-9` → `min-h-[36px] h-auto` yap
- `default` ve `lg` size'lara dokunma (Hero CTA bunları kullanıyor)

### 3. `src/components/ui/input.tsx` — Input sabit yükseklik
- `h-10` → `min-h-[40px] h-auto` yap

### 4. `src/components/chat/ChatInput.tsx` — Send button
- `h-11 w-11` → `min-h-[44px] min-w-[44px] h-auto w-auto` yap

### 5. `src/components/chat/ChatMessage.tsx` — Mesaj metni break-word
- Mesaj bubble'daki inline `style` zaten `overflowWrap: 'break-word'` içeriyor — yeterli, ek değişiklik yok

### 6. `src/components/navigation/BottomNav.tsx` — Tab buton yüksekliği
- `min-h-[48px]` zaten var — ek değişiklik yok

### 7. `src/pages/Standings.tsx` — Takım adı break-word
- Tablo hücrelerindeki takım adlarına `break-words min-w-0` ekle (satır yüksekliği değişmeyecek)

### 8. `src/pages/Profile.tsx` — Email break-word
- Kullanıcı email alanına `break-all min-w-0` ekle

## Dokunulmayacaklar
- HeroSection — CTA butonu `lg` size, değişmeyecek
- Tablo satır yükseklikleri
- Kart spacing ve padding
- BottomNav layout

