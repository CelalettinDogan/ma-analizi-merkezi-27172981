

# Login Ekranı — Premium Native Yeniden Tasarım

## Mevcut Sorunlar
- Radix TabsList/TabsTrigger generic web UI hissi veriyor
- Input alanları düz ve sıradan — focus state zayıf
- Brand alanı (logo + başlık) sıkışık ve hiyerarşisi zayıf
- CTA butonu standart — premium hissi yok
- Mikro etkileşim yok — dokunma geri bildirimi eksik
- Hover state'ler var (web kalıntısı)

## Yapılacak Değişiklikler

**Tek dosya:** `src/pages/Auth.tsx`

### 1. Brand Alanı — Güçlü Hiyerarşi
- Logo: `w-16 h-16` (büyütme) + `shadow-[0_0_30px_hsl(152_60%_40%/0.15)]` subtle glow
- Başlık: `text-[28px] font-bold tracking-tight` — daha güçlü
- Slogan: `text-[13px] text-muted-foreground/70 tracking-wide uppercase` — refined
- Logo-başlık arası `gap-3`, başlık-slogan arası `gap-0.5`

### 2. Segmented Control — Custom Toggle
- Radix TabsList yerine custom segmented control
- `bg-muted/20 rounded-2xl p-1` container
- Aktif segment: `bg-card rounded-xl shadow-sm` — floating pill efekti
- `framer-motion layoutId` ile smooth geçiş animasyonu
- `whileTap={{ scale: 0.97 }}` touch feedback

### 3. Input Alanları — Premium Styling
- `bg-muted/20 border-0 rounded-2xl` — borderless modern stil
- Focus: `ring-2 ring-primary/30 bg-muted/30` — belirgin glow ring
- `transition-all duration-200` ile smooth focus animasyonu
- Icon rengi focus'ta `text-primary` olacak (state tracking ile)
- Input yüksekliği `h-[52px]` — daha rahat touch target

### 4. CTA Butonu — Premium Action
- `rounded-2xl h-[52px] font-semibold text-[15px]`
- `bg-primary shadow-[0_4px_16px_hsl(152_60%_40%/0.3)]` — glow shadow
- `motion.button` ile `whileTap={{ scale: 0.97 }}` press feedback
- Loading state korunur

### 5. Mikro Etkileşimler (framer-motion)
- Form geçişleri: `AnimatePresence` + fade/slide
- Toggle değişimi: `layoutId` animasyonu
- Tüm butonlar: `whileTap` scale
- Label'lar: input focus'ta `text-foreground` renk geçişi

### 6. Spacing Optimizasyonu
- Login form: `space-y-4` (3'ten artır)
- Register form: `space-y-3` (2'den artır — 3 input + checkbox + button sığmalı)
- Label-input gap: `space-y-2` korunur
- Container padding: `px-7` (6'dan artır — daha fazla "hava")

### 7. "Şifremi Unuttum" — Minimal Link
- `text-[11px] text-muted-foreground/60` — daha subtle
- Hover yok, sadece `active:text-primary` touch feedback

### 8. Legal Disclaimer — Daha Entegre
- `text-[10px] text-muted-foreground/40` — neredeyse görünmez ama okunabilir

## Dokunulmayacaklar
- Tüm form mantığı (handleLogin, handleRegister, handleResetPassword) aynen kalır
- Privacy/Terms sheet'leri aynen kalır
- Reset dialog aynen kalır
- h-screen overflow-hidden layout korunur

## Görsel Sonuç
```text
┌─────────────────────────┐
│                         │
│        [Logo 64px]      │
│      GolMetrik AI       │
│   AKILLI FUTBOL ANALİZİ │
│                         │
│  ┌─────────┬──────────┐ │
│  │ Giriş ● │  Kayıt   │ │  ← floating pill segment
│  └─────────┴──────────┘ │
│                         │
│  ┌─────────────────────┐│
│  │ 📧  ornek@email.com ││  ← borderless, soft bg
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🔒  ••••••••    👁  ││
│  └─────────────────────┘│
│         Şifremi Unuttum │
│                         │
│  ╔═════════════════════╗│
│  ║    Giriş Yap        ║│  ← glow shadow CTA
│  ╚═════════════════════╝│
│                         │
│  bilgilendirme amaçlıdır│
└─────────────────────────┘
```

