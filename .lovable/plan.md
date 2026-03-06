

# Updated Plan: Hibrit Market Selection + Native Tap-to-Expand

The plan file will be updated to include the tap-to-expand section alongside the existing hybrid market scoring plan.

---

## New Section: Native Tap-to-Expand Bottom Sheet

### `src/components/analysis/AnalysisDrawer.tsx`

**Tap vs Drag detection in peek mode:**
- Add `peekTouchStartY` ref and `peekTouchMoved` ref
- On `onTouchStart` in peek wrapper: record Y position, set `peekTouchMoved = false`
- On `onTouchMove`: if delta > 8px threshold, set `peekTouchMoved = true` (it's a drag, not a tap)
- On `onTouchEnd`: if `peekTouchMoved === false`, check if target is interactive element via `closest()` — if not interactive, call `expandToFull()`

**Interactive element filtering selector:**
```
button, a, input, textarea, select, [role="button"], [role="link"], [role="tab"], [data-interactive], [contenteditable="true"]
```

**Peek content wrapper changes:**
- Wrap the `isPeek` branch content in a div with:
  - Touch handlers for tap detection (separate from existing drag handle handlers)
  - `role="button"`, `aria-label="Detaylar için dokun"`, `tabIndex={0}`
  - `onKeyDown` handler for Enter/Space to trigger `expandToFull()`
  - `active:scale-[0.995]` transition for native press feedback
  - `cursor-pointer` styling

**Existing drag handle behavior preserved** — the drag handle area keeps its own touch handlers for swipe-to-close/expand gestures unchanged.

### `src/components/analysis/AnalysisHeroSummary.tsx`

- Remove `onExpand` prop entirely
- Remove the "Detaylı Analiz" `Button` component (lines 139-148)
- Remove `Target` and `Button` imports
- Add a subtle visual affordance at the bottom:
  ```
  <div className="flex flex-col items-center gap-1 pt-2 pb-1">
    <ChevronUp className="w-5 h-5 text-muted-foreground/40 animate-bounce" style={{ animationDuration: '2s' }} />
    <span className="text-[10px] text-muted-foreground/40 tracking-wide">Detaylar için dokun</span>
  </div>
  ```
- Keep the bounce animation subtle (2s duration) for premium feel, not playful

### How it works together

```text
User taps peek area
  → touchStart records position
  → touchEnd checks:
      1. Did finger move > 8px? → It's a drag, ignore
      2. Did tap land on interactive element? → Let it handle normally
      3. Otherwise → expandToFull()
```

### Files changed
1. `src/components/analysis/AnalysisDrawer.tsx` — peek tap handler + accessibility wrapper
2. `src/components/analysis/AnalysisHeroSummary.tsx` — remove button, add visual affordance hint

### Updated plan.md
The `.lovable/plan.md` file will be updated to include this section as a new task block after the existing hybrid market scoring plan.

