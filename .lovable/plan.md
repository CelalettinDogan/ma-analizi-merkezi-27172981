

## Plan: Android WebView UI Stability Audit & Fix

### Audit Results

| Check | Status | Action |
|---|---|---|
| Font counter-scaling (`main.tsx`) | ✅ Done | No change |
| `text-size-adjust: 100%` on `*` | ✅ Done | No change |
| `html` font-size lock | ✅ Done | No change |
| Capacitor `textZoom: 100` | ✅ Done | No change |
| Viewport meta tag | ✅ Done | No change |
| `min-width: 0` on `*` | ✅ Done | No change |
| `min-height: 0` on flex items | ❌ Missing | Add to `*` selector |
| `overflow-wrap: break-word` | ❌ Missing | Add globally |
| Form element font-size lock | ❌ Missing | Add `font-size: 16px` to form elements |
| Android `100vh` bug | ⚠️ Partial | Add JS-driven `--app-height` CSS variable |
| Keyboard resize config | ✅ Done | Already `resize: 'body'` |

### Changes

**1. `src/index.css` — 3 additions to `@layer base`**

Add to the existing `*` selector:
- `min-height: 0` — prevents flex children from overflowing their containers
- `overflow-wrap: break-word` — prevents long text (URLs, hashes) from breaking layouts

Add new rule for form elements:
```css
button, input, textarea, select {
  font-size: inherit;
  -webkit-text-size-adjust: 100% !important;
}
```
Using `inherit` instead of hardcoded `16px` so they respect the counter-scaled root, while preventing Android WebView from independently scaling form elements.

**2. `src/main.tsx` — Dynamic viewport height variable**

Add a `setAppHeight` function that sets `--app-height` CSS variable on `documentElement` to `window.innerHeight + 'px'`. This provides the actual visible viewport height, accounting for Android navigation bars and keyboard. Run on `resize` and `orientationchange`.

**3. `src/components/navigation/TabShell.tsx` — Use `--app-height`**

Replace inline `height: '100vh'` (line 147) with `height: 'var(--app-height, 100vh)'` so it uses the JS-measured height when available, falling back to `100vh`.

### Files Modified

| File | Change |
|---|---|
| `src/index.css` | Add `min-height: 0`, `overflow-wrap`, form element font lock |
| `src/main.tsx` | Add `setAppHeight()` function + event listeners |
| `src/components/navigation/TabShell.tsx` | `100vh` → `var(--app-height, 100vh)` |

No UI design changes. Only stability improvements.

