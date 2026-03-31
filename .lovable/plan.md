

## Plan: BottomNav — 2026 Premium Native Polish

### Mevcut Durum (Ekran İncelemesi)
BottomNav zaten iyi bir temele sahip: floating layout, backdrop-blur, spring animasyonları, AI vurgusu, safe-area desteği. Ancak birkaç detay 2026 premium native standardının altında:

| # | Sorun | Detay |
|---|-------|-------|
| 1 | 6 tab sıkışıklık | Free kullanıcıda 6 tab var (Ana, Canlı, AI, Lig, Pro, Profil) — her biri çok dar, label'lar sıkışık |
| 2 | Inactive opacity çok düşük | `text-muted-foreground/45` neredeyse görünmez, accessibility sorunu |
| 3 | Active pill ve AI glow çakışıyor | `layoutId="navPill"` hem normal hem AI için kullanılıyor — geçiş garip olabiliyor |
| 4 | Shadow yönü tutarsız | `shadow-[0_4px_32px...]` aşağı doğru shadow — floating bar için yukarı doğru olmalı |
| 5 | Haptic feedback yok | Native app'lerde tab geçişinde titreşim beklenir |
| 6 | Border çok subtle | `border-border/10` neredeyse görünmez, derinlik hissi zayıf |

### İyileştirmeler

**1. Inactive Opacity Artışı**
- `text-muted-foreground/45` → `text-muted-foreground/55` (ikonlar)
- Label'lar da `/55` yapılacak — accessibility uyumu

**2. Shadow Düzeltmesi**
- `shadow-[0_4px_32px_-4px_rgba(0,0,0,0.12),0_-2px_12px_rgba(0,0,0,0.04)]` → `shadow-[0_-4px_32px_-4px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)]`
- Floating bar'ın yukarı doğru yumuşak gölgesi

**3. Border Güçlendirme**
- `border-border/10` → `border-border/15` — derinlik artışı, hala subtle

**4. Haptic Feedback (Capacitor)**
- `@capacitor/haptics` ile tab tıklamada `ImpactStyle.Light` titreşim ekle
- Web'de graceful fallback (no-op)

**5. Active Pill İyileştirmesi**
- Pill bg: `bg-primary/12` → `bg-primary/10` — daha subtle, daha premium
- AI glow: `shadow-[0_0_12px...]` → `shadow-[0_0_16px...]` — biraz daha belirgin

**6. Label Spacing**
- İkon-label arası `gap-1` → `gap-1.5` — daha nefes alan düzen

**7. Container Padding**
- `py-1.5` → `py-2` — biraz daha yüksek bar, daha rahat dokunma alanı

### Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `src/components/navigation/BottomNav.tsx` | Shadow, opacity, spacing, haptic, border ince ayarları |

Tek dosya. Fonksiyonalite değişmez. Sadece görsel ve dokunsal polish.

