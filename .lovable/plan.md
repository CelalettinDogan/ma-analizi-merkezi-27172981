

# Fix: Instant Bottom Nav with Cached Role State

## Problem
`useAccessLevel.isLoading` waits for 3 async operations (auth session, premium subscription query, user roles query) before becoming `false`. Currently `BottomNav` returns `null` during this period → 2-3s delay.

## Solution: localStorage-based optimistic state

Cache `isAdmin` and `isPremium` in localStorage after each successful resolution. On next app launch, read cached values synchronously → render correct nav instantly. Background API calls silently update if the cached state was stale.

## Architecture

```text
Mount → Read localStorage cache (sync, 0ms)
      → Render nav with cached values immediately
      → Fetch real roles/premium from DB (async, 1-2s)
      → If different from cache → update cache + re-render
      → If same → no visual change
```

## Changes

### File 1: New `src/hooks/useCachedAccessLevel.ts`
A lightweight hook specifically for BottomNav that:
1. Reads `{ isAdmin, isPremium }` from `localStorage` synchronously on mount (no loading state)
2. Subscribes to the real `useAccessLevel` hook
3. When real data resolves, writes to localStorage and returns real values
4. Returns `isLoading: false` always (cached data is always available)
5. Returns `isResolved: boolean` to indicate if real data has arrived

```typescript
const CACHE_KEY = 'nav_access_cache';

export const useCachedAccessLevel = () => {
  // Sync read from localStorage - available on first frame
  const cached = useMemo(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : { isAdmin: false, isPremium: false };
    } catch { return { isAdmin: false, isPremium: false }; }
  }, []);

  const [state, setState] = useState(cached);
  const real = useAccessLevel();

  useEffect(() => {
    if (!real.isLoading) {
      const next = { isAdmin: real.isAdmin, isPremium: real.isPremium };
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      setState(next);
    }
  }, [real.isLoading, real.isAdmin, real.isPremium]);

  return { ...state, isResolved: !real.isLoading };
};
```

### File 2: `src/components/navigation/BottomNav.tsx`
- Replace `useAccessLevel` with `useCachedAccessLevel`
- Remove `if (isLoading) return null;` — nav always renders
- `computedItems` uses cached `isAdmin`/`isPremium` which are available synchronously

### File 3: `src/hooks/useUserRole.ts`
- On successful role fetch, write roles to localStorage
- On mount, initialize `roles` state from localStorage cache (sync) instead of empty array
- This makes `isAdmin` available immediately even before the DB query completes

### File 4: `src/hooks/usePremiumStatus.ts`
- On successful premium fetch, write subscription to localStorage
- On mount, initialize `subscription` state from localStorage cache (sync) instead of null
- Set `isLoading` initial state to `false` when cache exists (data is available)

### Logout Cleanup
- In `AuthContext.signOut()`, clear the cached keys so next user starts fresh

### File 5: `src/contexts/AuthContext.tsx`
- Add `localStorage.removeItem(CACHE_KEY)` calls in `signOut` for both nav cache and role/premium caches

## Key Behaviors
- **First-ever login (no cache)**: Falls back to `{ isAdmin: false, isPremium: false }` → shows Pro tab → if user is actually premium, Pro tab disappears after ~1s (acceptable for first login only)
- **Every subsequent launch**: Cached values match reality → zero flicker, zero delay
- **Role change**: Background fetch updates cache → next launch is correct; current session updates within 1-2s
- **Logout → different user login**: Cache cleared on logout → fresh start for new user

