

# Bottom Navigation Overlap Fix

## Problem
Profile page and AnalysisDrawer content gets cut off by the fixed BottomNav (~80px + safe-area). Current `pb-24` (96px) isn't enough when safe-area-inset-bottom is added on top.

## Fix

### 1. Profile.tsx — line 229
Change `pb-24` to use `calc()` with safe-area:
```
pb-24 → style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
```
Apply same fix to loading state (line 186) and unauthenticated state (line 201).

### 2. AnalysisDrawer.tsx — line 92
The inner content div already has `pb-24` but the scrollable container uses `pb-safe`. Change the inner `pb-24` to a larger value that accounts for both BottomNav overlap and safe-area:
```
pb-24 → pb-32
```
Note: The drawer is a full-screen overlay (z-50) so BottomNav isn't visible behind it, but extra bottom padding ensures the LegalDisclaimer at the bottom is fully scrollable past the rounded bottom edge.

### 3. Index.tsx — Check main content padding
Verify and fix the main scroll container's bottom padding similarly.

### 4. Other tab pages (Live, Chat, Standings, Premium)
Search for any `pb-24` in these pages and apply the same `calc(80px + env(safe-area-inset-bottom))` pattern for consistency.

## Files to Change
| File | Change |
|------|--------|
| `src/pages/Profile.tsx` | Replace `pb-24` with inline style `paddingBottom: calc(80px + env(safe-area-inset-bottom))` on all 3 main containers |
| `src/components/analysis/AnalysisDrawer.tsx` | Increase inner content `pb-24` → `pb-32` for full scroll clearance |
| `src/pages/Live.tsx`, `src/pages/Chat.tsx`, `src/pages/Standings.tsx`, `src/pages/Premium.tsx`, `src/pages/Index.tsx` | Audit and fix `pb-24` to use safe-area-aware padding |

