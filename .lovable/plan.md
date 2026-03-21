

## Plan: Premium Screen — 2026 Native Redesign

### Current Issues (from screenshot)
- Price text "₺478.99/yıl" wraps awkwardly on one line with period suffix
- All 3 cards are equally sized — no visual hierarchy for the popular plan
- Cards lack padding, shadows, and premium feel
- No social proof or trust elements
- Feature list is plain text, not pill badges
- CTA button is decent but could be more premium

### Changes (single file: `src/pages/Premium.tsx`)

**1. Plan Cards Layout**
- Switch from `grid-cols-3 gap-2` to a flex layout with the center Plus card scaled up (`scale-105`, `z-10`) and side cards slightly smaller/faded (`opacity-80`)
- Add more internal padding (`p-4` instead of `px-2 pb-3`)
- White background with soft shadow: `bg-white dark:bg-card shadow-lg` on popular, `shadow-sm` on others
- Round corners `rounded-2xl`

**2. Price Typography**
- Split price into two lines using flex-col: big bold price on top, muted period text below
- Price: `text-xl font-extrabold whitespace-nowrap`
- Period: `text-xs text-muted-foreground`
- No wrapping — price and suffix never on same line

**3. Popular Badge**
- Gradient pill: `bg-gradient-to-r from-primary to-emerald-500` with rounded-full, slight shadow
- Positioned at top-center of card with negative margin overlay

**4. Trust & Social Proof Section**
- Add below feature pills: three trust lines
  - "10.000+ kullanici guveniyor"
  - "%61 dogruluk orani"  
  - "2 ay ucretsiz (sinirli teklif)" for yearly

**5. Feature Pills**
- Convert `includedFeatures` from check+text to pill badges with icon inside
- Style: `bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium`

**6. CTA Enhancement**
- Keep existing gradient button
- Add stronger shadow: `shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.4)]`

**7. Responsive Safety**
- All text containers use `truncate` or `whitespace-nowrap`
- Cards use `min-w-0` to prevent overflow
- On screens < 360px, cards shrink gracefully via flex layout

No functionality changes. No color palette changes. Only layout, typography, and spacing improvements.

