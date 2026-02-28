

# Fix: Bottom Nav Flicker — Skeleton + Tri-State Role Architecture

## Root Cause

The current `useCachedAccessLevel` hook defaults to `{ isAdmin: false, isPremium: false }` when no cache exists (first login, cleared cache, new device). This causes:
1. `computedItems` computes with free-user logic → shows Pro tab
2. 1-2s later, real role resolves → Pro tab disappears

The localStorage cache only helps on **subsequent** launches. First login always flickers.

## Solution: Tri-State with Skeleton

### Concept
- Role state has 3 phases: `unresolved` → `resolved`
- When unresolved: render skeleton nav (correct height, placeholder items, no real tabs)
- When resolved: render real nav with correct items
- No default role assumption. No negative checks.

### Changes

#### File 1: `src/hooks/useCachedAccessLevel.ts`
- Add `isResolved` flag (already exists but not used by BottomNav)
- Keep localStorage cache for fast subsequent launches
- When cache exists: `isResolved` starts as `true` with cached values (instant render)
- When no cache: `isResolved` starts as `false` → skeleton shown

**No logic change needed** — hook already returns `isResolved: !real.isLoading`. The issue is BottomNav doesn't use it.

#### File 2: `src/components/navigation/BottomNav.tsx`
- Destructure `isResolved` from `useCachedAccessLevel()`
- When `!isResolved`: render skeleton nav (5 placeholder items matching nav dimensions)
- When `isResolved`: render real `computedItems`
- Change Pro tab logic from negative check `(isPremium || isAdmin) ? filter : keep` to explicit positive: only include Pro when `!isPremium && !isAdmin` (already the case logically, but make it clearer)
- Skeleton uses same container structure (fixed positioning, safe-area padding, backdrop blur)

#### Skeleton Nav Structure
```tsx
if (!isResolved) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" ref={ref}>
      <div className="bg-card/95 backdrop-blur-2xl border-t border-border/30">
        <div className="flex items-center py-1.5" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[48px] gap-1">
              <div className="w-[22px] h-[22px] rounded-md bg-muted animate-pulse" />
              <div className="w-6 h-2 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

### Behavior Matrix
| Scenario | First Frame | After Resolve |
|---|---|---|
| No cache (first login) | Skeleton nav | Real nav (correct items) |
| Cache exists (returning user) | Real nav from cache | Silent update if changed |
| Logout → new user | Cache cleared → skeleton | New user's real nav |

### Files Modified
1. `src/components/navigation/BottomNav.tsx` — add skeleton when `!isResolved`

That's it. One file change. The `useCachedAccessLevel` hook already provides everything needed.

