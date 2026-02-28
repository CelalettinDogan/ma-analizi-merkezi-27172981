

# Fix: Android Release Build White Screen

## Root Cause Analysis

After inspecting the codebase, two high-probability causes identified:

### 1. `dvh` CSS unit not supported on older Android WebViews
`TabShell.tsx` line 132 uses inline `minHeight: '100dvh'`. Chrome-based WebViews below v108 (Android 12 and older) ignore this value entirely → container collapses to 0 height → white screen. Same issue in multiple pages (`Profile.tsx`, `Chat.tsx`, `Premium.tsx`, `PremiumGate.tsx`).

### 2. No per-tab error isolation
TabShell renders ALL 6 pages simultaneously. If ANY page throws a render error, the entire TabShell crashes. ErrorBoundary wraps the whole shell, so the error card would show — but if it's an async/effect error (e.g. Supabase query failure during unmounted component), it can leave a blank state.

### Cloud Balance Question
**No**, cloud balance exhaustion does NOT cause white screens. Supabase database queries go directly to Supabase servers. Cloud balance only affects edge function deployments and Lovable-specific features. Your app's data queries will continue working.

---

## Changes

### File 1: `src/components/navigation/TabShell.tsx`
- Change inline `minHeight: '100dvh'` to `minHeight: '100vh'` as base, with CSS class `min-h-dvh` for progressive enhancement via Tailwind (which handles fallback)
- Actually simpler: just use the Tailwind class `min-h-screen` (100vh) as the base and let `min-h-dvh` override when supported
- Wrap each tab's `<Component />` in an individual ErrorBoundary so one broken page doesn't kill all tabs

### File 2: `src/pages/Chat.tsx`
- Change `h-dvh` → `h-screen` (safe fallback, universally supported)

### File 3: `src/pages/Profile.tsx`
- Change `h-[100dvh]` → `h-screen` (3 occurrences)

### File 4: `src/pages/Premium.tsx`
- Change `min-h-[100dvh]` → `min-h-screen` (2 occurrences)

### File 5: `src/pages/Auth.tsx`
- Change `h-[100dvh]` → `h-screen`

### File 6: `src/components/chat/PremiumGate.tsx`
- Change `min-h-dvh` → `min-h-screen`

All changes replace `dvh` with `vh` equivalents via Tailwind's `h-screen` / `min-h-screen` classes which are universally supported.

