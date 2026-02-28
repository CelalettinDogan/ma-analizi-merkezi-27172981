

# Fix: Bottom Nav Flicker on Role Loading

## Problem
`isLoading` is true initially, and the current code falls back to `stableItemsRef.current ?? computedItems`. On first mount, `stableItemsRef.current` is null, so it uses `computedItems` which is computed with `isAdmin=false, isPremium=false` (default state). This shows the "Pro" tab for 1-2 seconds until roles resolve.

## Solution
Don't render the nav at all until `isLoading` is false. This is a single-line guard.

### File: `src/components/navigation/BottomNav.tsx`

Add early return when loading:

```tsx
// After the hooks, before the return
if (isLoading) return null;
```

Remove the `stableItemsRef` mechanism entirely — it was a workaround for the flicker but doesn't solve it. With the loading guard, `computedItems` will always have correct role data when rendered.

### Changes summary:
1. Add `if (isLoading) return null;` after hooks
2. Remove `stableItemsRef` and the `navItems` memo — use `computedItems` directly
3. Replace `navItems.map` with `computedItems.map`

