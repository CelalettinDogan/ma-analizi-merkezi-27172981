## Fix: Daily Pick Row Not Visible

The daily pick row is inside `displayedMatches.map` so it only renders when matches exist. The match list is currently empty, so nothing shows.

### Changes to `src/components/TodaysMatches.tsx`

1. **Extract `dailyPickRow` JSX** from inside the `displayedMatches.map` callback to a standalone variable defined before the empty-state check (around line 219).

2. **Show in empty state**: In the `matches.length === 0` early return, insert `{dailyPickRow}` after the section header so the daily pick is visible even with no matches.

3. **Show in match list**: In the `<div className="space-y-1">` match list section, insert `{dailyPickRow}` after the first match row. Remove the old `dailyPickRow` definition and render from inside the `.map()` callback.

4. **Remove duplicate code**: The dailyPickRow variable inside `.map` (lines 323-364) and the `{dailyPickRow}` render on line 403 will be replaced by a single insertion after the first item using a conditional check outside the map, or by splitting the displayed matches and inserting in between.

This ensures the "Gunun Skor Tahmini" row is always visible regardless of whether the match list is empty or populated.
