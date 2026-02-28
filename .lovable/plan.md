

# Bottom Navigation — Minimal Redesign

## Changes (single file: `src/components/navigation/BottomNav.tsx`)

### 1. Shorten labels
- "Ana Sayfa" → "Ana"
- "Canlı" → "Canlı" (already short)
- "AI Asistan" → "AI"
- "Sıralama" → "Lig"
- "Premium" → "Pro"
- "Profil" → "Profil" (already short)

### 2. Label styling
- Font: `text-[10px]` with `whitespace-nowrap` and `leading-none`
- Gap between icon and label: `gap-1` (was `gap-0.5`)

### 3. Icon sizing
- Keep `w-5 h-5` (20px) — good touch readability

### 4. Button layout
- Remove `min-w-[56px]`, use `flex-1` so tabs share width equally
- Keep `min-h-[48px]` for touch target
- Padding: `py-2 px-1`

### 5. Badges — minimal
- Remove premium star badge entirely (too noisy)
- Keep live pulse dot but make it smaller: `w-1 h-1`
- Remove active badge

### 6. Active state
- Keep `motion.div` layoutId pill but change to `bg-primary/6 rounded-2xl`
- Active: icon + label `text-primary`
- Inactive: `text-muted-foreground/70` (slightly lighter for more contrast with active)

### 7. Container
- Change to `bg-card/95 backdrop-blur-2xl border-t border-border/30`
- Inner row: `py-1.5` top, safe-area bottom stays

Result: flat, compact, evenly spaced tabs — Linear/Notion aesthetic.

