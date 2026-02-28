

# Fix PremiumGate CTA Layout

## Problem
PremiumGate uses `fixed inset-0 z-50` for the full page and `fixed bottom-0` for the CTA. The CTA sits at `bottom-0` with `pb-safe`, but BottomNav is also `fixed bottom-0 z-50` — they overlap and the CTA goes behind the nav.

## Changes (single file: `src/components/chat/PremiumGate.tsx`)

### 1. Remove full-screen fixed overlay
- Change outer container from `fixed inset-0 z-50` to a normal flow container
- Use `min-h-dvh flex flex-col bg-background` so it fills viewport naturally

### 2. Make main content scrollable with proper bottom padding
- Keep `flex-1 overflow-y-auto`
- Add bottom padding: `calc(140px + env(safe-area-inset-bottom, 0px))` — accounts for CTA height (~64px) + BottomNav height (~64px) + safe area + spacing

### 3. Reposition CTA above BottomNav
- Change CTA from `fixed bottom-0` to `fixed` with `bottom` set to `calc(64px + env(safe-area-inset-bottom, 0px))` — sits right above the BottomNav
- Remove `pb-safe` from CTA (no longer at screen edge)
- Set `z-index: 40` (below BottomNav's z-50 but above content)

### 4. Remove `pb-32` from main
- Replace with dynamic `paddingBottom` style to match CTA + nav height

