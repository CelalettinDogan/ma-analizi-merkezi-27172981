
# 2026 Native Premium UX Yükseltmesi

## Dürüst Mevcut Durum Analizi

Phase 1 bileşenleri **fonksiyonel ama henüz "premium native" değil**. Şu an 7/10. Spotify Premium, Revolut Metal, Strava Subscribe, Apple One gibi 2026 referanslarına göre eksikler:

| Bileşen | Sorun | Etki |
|---|---|---|
| `PremiumTeaserOverlay` | `max-h-16` ile sadece "kesilmiş" metin. `blur-sm` yok, gerçek frosted-glass yok. CTA pill statik. | Kullanıcı "eksik" hissetmiyor, "kırık" hissediyor. |
| `LastFreeAnalysisBanner` | Basit gradient + statik ikon. Pulse/shimmer yok. Haptic yok. Aciliyet hissi zayıf. | Atlanıyor, fark edilmiyor. |
| `PlanComparisonTable` | Klasik HTML tablo. Mobilde 4 kolon 390px'e sıkışıyor, `text-[11px]` okunmuyor. "Plus" highlight çok soluk. | Karşılaştırma yapılmadan kapatılıyor. |
| `SocialProofCounter` | Tek satır küçük gri yazı. `count===0` durumunda bile gösteriliyor (ters etki). Animasyon yok. | Görünmez. |
| `AIRecommendationCard` blur | Sadece `max-h-16 overflow-hidden` — gerçek blur yok. Premium içerik "saklı" değil "kesik". | Teaser etkisi sıfır. |

---

## Yapılacak İyileştirmeler

### 1. PremiumTeaserOverlay — Gerçek Cinematic Blur
- `AIRecommendationCard`'da içeriği `max-h-24 + blur-[6px] + opacity-60 + saturate-150` ile kapla → gerçek "saklı premium içerik" hissi
- Overlay'e **3 katmanlı gradient**: alt karartma + üstte ince light sweep
- CTA pill'e **shimmer animasyonu** (2s loop, sol→sağ ışık geçişi)
- Tıklamada **Capacitor Haptics `ImpactStyle.Medium`** + scale 0.94 spring
- Crown ikonuna **hafif rotate-12 + glow** (drop-shadow primary)
- Üstte küçük "🔒 Locked" mikro etiket (spam değil, gerçek kilit hissi)

### 2. LastFreeAnalysisBanner — Aciliyet & Hareket
- Sol kenarda **3px dikey amber accent bar** (Apple Mail flag tarzı)
- Crown ikonu yerine **animated countdown ring** (1/3 dolu daire içinde "1")
- Arkaplan: `bg-gradient-to-r` yerine **çift katman** (glassmorphism + animated mesh gradient)
- Mount'ta **subtle pulse** (sadece ilk 3 saniye, sonra durur — iOS Mail unread)
- "Son ücretsiz analiz" yerine güçlü dil: **"1 analysis left today"** + alt satırda count-up "Join 247 users who upgraded"
- Tıklamada **`ImpactStyle.Light` haptic**

### 3. PlanComparisonTable — Mobile-First Kart Tasarımı
- Klasik tabloyu **kart-bazlı yatay snap-scroll** ile değiştir (Apple One karşılaştırma sayfası tarzı)
- **2 kolon** göster: "Free" (sol, sticky, soluk) + seçilen plan (sağ, vurgulu)
- Üstte **pill segmented control** plan seçimi (Basic / Plus / Pro), Plus default
- Her satırda Free tarafında ❌ veya kısıtlı sayı (örn. "3/day"), Plus tarafında ✓ + emerald glow
- Geçişlerde **layout animation** (framer-motion `layoutId`)
- Sticky CTA bar altta: "Upgrade to {selectedPlan} →"

### 4. SocialProofCounter — Görünür & Güvenilir
- `count === 0` ise **hiç render etme** (mevcut fallback ters etki yaratıyor)
- Eşik: sadece `count >= 5` olunca göster
- **Avatar stack** (3 fake/anonim yuvarlak gradient avatar, üst üste -ml-2)
- Yanında count-up animasyon (`useCountUp` benzeri, 0→count, 800ms)
- Yeşil **live dot** (pulse 2s) + "247 upgraded this week"
- Yumuşak `bg-emerald-500/5` rounded-full pill içinde

### 5. AIRecommendationCard Teaser Entegrasyonu
- Premium olmayan kullanıcı için reasoning bloğunu **`relative h-28 overflow-hidden`** içine al
- İçerik: `blur-[5px] opacity-50 select-none pointer-events-none`
- Üstte **"AI Detailed Reasoning"** mikro başlık + lock ikonu
- Yeni `PremiumTeaserOverlay`'i bunun üzerine yerleştir
- CTA tıklanınca `/premium` sayfasına **`?from=ai-reasoning` query** ile git → Premium sayfasında tracking için

### 6. Premium Sayfasında Cinematic Detaylar
- Sayfa açılışta **staggered fade-up** (her bileşen 80ms gecikme)
- En üste **dinamik "Hero Glow"**: arkaplanda yavaşça hareket eden iki radial gradient (primary + amber)
- PlanCard'larda Plus'a **subtle floating animation** (y: [0, -3, 0], 4s loop)
- "Save X%" badge'ine **ribbon shape** (sağ üst köşede çapraz, daha pro)
- Sayfa altına **"30-day money back" + "Cancel anytime"** trust badges (4 ikonlu satır)

### 7. Yeni Ortak Yardımcı: `useHapticTap`
- Tek satır hook: `const tap = useHapticTap('light' | 'medium')`
- Tüm CTA'larda `onClick={() => { tap(); navigate(...) }}`
- Capacitor mevcut değilse no-op (web fallback)

---

## Teknik Detaylar

**Dosyalar:**
- `src/hooks/useHapticTap.ts` (yeni)
- `src/components/premium/PremiumTeaserOverlay.tsx` (yeniden yaz — shimmer + 3-layer gradient)
- `src/components/premium/LastFreeAnalysisBanner.tsx` (accent bar + countdown ring + pulse)
- `src/components/premium/PlanComparisonTable.tsx` (tablo → kart, segmented control)
- `src/components/premium/SocialProofCounter.tsx` (avatar stack + count-up + threshold)
- `src/components/premium/HeroGlow.tsx` (yeni — animated radial gradient bg)
- `src/components/premium/TrustBadges.tsx` (yeni — 4 ikon trust strip)
- `src/components/analysis/AIRecommendationCard.tsx` (teaser bloğu yeniden — gerçek blur)
- `src/pages/Premium.tsx` (HeroGlow + TrustBadges + stagger animation)
- `src/i18n/locales/{tr,en,de,es,ar}/premium.json` (yeni anahtarlar: `teaser.locked`, `teaser.detailedReasoning`, `lastFreeAnalysis.urgentTitle`, `compare.selectPlan`, `social.joinedThisWeek`, `trust.moneyBack`, `trust.cancelAnytime`, `trust.securePayment`, `trust.instantAccess`)

**Animasyonlar:**
- Shimmer: pure CSS keyframe (`@keyframes shimmer` index.css'e ekle, GPU-friendly transform-only)
- Count-up: küçük inline hook (rAF based, dependency yok)
- Pulse: `motion.div` `animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: 3 }}`

**Haptics:**
- `@capacitor/haptics` zaten projede mevcut (memory'den biliyoruz)
- `useHapticTap`: try/catch ile native check, fail olursa sessizce geç

**Performans:**
- Tüm blur'lar `will-change: filter` ile GPU'ya at
- HeroGlow `pointer-events-none` + `aria-hidden`
- Avatar stack SVG tek dosyada (3 küçük gradient circle, ~400 byte)

**Erişilebilirlik:**
- Tüm CTA'larda `aria-label`
- Blur'lı içerik `aria-hidden="true"` (screen reader sadece CTA'yı okusun)
- `prefers-reduced-motion` kontrolü: shimmer/pulse disable

---

## Beklenen Sonuç

7/10 → **9.5/10**. Spotify Premium / Apple One / Revolut Metal upsell ekranlarıyla aynı liga. Onaylarsan tek seferde uygularım.
