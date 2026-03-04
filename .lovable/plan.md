# UI/UX Modernization Pass — 2026 Premium Native Feel

## Overview

Visual polish and interaction quality improvements across 7 key areas. No layout or information architecture changes.

## Changes

### 1. Hero Section — Slight vertical reduction

**File: `src/components/HeroSection.tsx**`

- Reduce `pb-6` → `pb-4` for tighter vertical rhythm
- Keep CTA size and structure unchanged

### 2. League Selector Chips — Modern pill style

**File: `src/components/league/LeagueGrid.tsx**`

- Active state: stronger `bg-primary` with `shadow-md shadow-primary/20`
- Non-active: `bg-card border border-border/50 shadow-sm` (soft elevation + clear border)
- Pill radius: `rounded-full` instead of `rounded-xl`
- Press animation: `whileTap={{ scale: 0.95 }}` (stronger feedback)

### 3. Match Cards — Elevation & CTA prominence

**File: `src/components/match/MatchCarousel.tsx` (MatchSlide)**

- Add `shadow-sm` elevation to card
- "Analiz Et →" text → pill-style CTA with `bg-primary/10 rounded-full px-3 py-1`
- Press: `whileTap={{ scale: 0.97 }}` already present, keep it

**File: `src/components/TodaysMatches.tsx**`

- Featured card: add `shadow-sm` 
- CTA row: make "Analiz Et" more prominent with `bg-primary/10 rounded-full px-3 py-1`
- Match list rows: add `border-b border-border/10` subtle separators between rows

**File: `src/components/live/LiveMatchCard2.tsx**`

- Add `shadow-sm` to card
- "Hızlı Analiz" → pill-style CTA `bg-primary/10 rounded-full px-3 py-1`

### 4. Standings Table — Row spacing & separators

**File: `src/pages/Standings.tsx**`

- Add subtle row dividers via TableRow: existing `hover:bg-muted/20` is fine
- Increase cell padding slightly: add `py-3` to TableCell (from default)
- Position number: add `text-muted-foreground` for non-special positions
- Points column: ensure `font-bold text-primary` for emphasis

### 5. Bottom Navigation — Icon weight & active contrast

**File: `src/components/navigation/BottomNav.tsx**`

- Increase icon size: `w-[22px] h-[22px]` → `w-[24px] h-[24px]`
- Increase stroke weight for active: `strokeWidth={1.75}` → active `strokeWidth={2}`, inactive stays `1.75`
- Active background: `bg-primary/8` → `bg-primary/12` for stronger contrast
- Active label: add `font-semibold` (currently `font-medium`)

### 6. Micro Interactions — Global press feedback

**File: `src/lib/animations.ts**`

- Update `cardTap` to `{ scale: 0.97 }` (currently may be different)
- Add `buttonPress` export: `{ scale: 0.97, transition: { duration: 0.1 } }`

### 7. Page Transitions

**File: `src/components/navigation/TabShell.tsx**` (if wrapping routes)  
  
8.Card padding standard: p-4

Inner spacing: gap-3

Section spacing: mt-6  
9. Typography polish

- Improve title tracking

- Slight weight increase for key labels

- Ensure consistent text scale hierarchy

- Verify `AnimatePresence` with `fadeIn` is applied to page transitions — add if missing  
10. Analysis-Centric Emphasis
  - Stronger visual hierarchy for analysis CTAs
  - Premium visual treatment for AI result screen
  - Animated data reveal for perceived intelligence

## Files to edit (7 files)

1. `src/components/HeroSection.tsx`
2. `src/components/league/LeagueGrid.tsx`
3. `src/components/match/MatchCarousel.tsx`
4. `src/components/TodaysMatches.tsx`
5. `src/components/live/LiveMatchCard2.tsx`
6. `src/pages/Standings.tsx`
7. `src/components/navigation/BottomNav.tsx`
8. `src/lib/animations.ts`

## Preserved

- Layout structure, spacing grid, color palette
- Information architecture
- Font scaling compatibility (min-h, break-words)
- Safe area handling  
  
