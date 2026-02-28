

# Analiz Drawer Bug Fix + Production-Ready Polish

## Root Cause Analysis

The drawer bug has two interacting issues:

1. **CSS transition not triggering on first render**: The drawer element starts in DOM with `translate-y-full`. When `shouldShow` flips to `true`, the browser may batch the class change with the initial paint, skipping the transition animation entirely. This causes the "frozen/buggy screen" on first open.

2. **Progress stuck at 95%**: `AnalysisLoadingState` progress caps at 95% by design, but there's no visual completion feedback. When analysis finishes, the loading state just vanishes (AnimatePresence exit) and the drawer tries to open simultaneously, creating a jarring UX.

## Fix Plan

### 1. AnalysisDrawer — Mount/unmount pattern instead of permanent DOM presence

Current: Drawer is always in DOM with `translate-y-full`, toggled via CSS class.
Problem: First transition doesn't animate because element was never painted in its initial state.

Fix: Only mount the drawer when `isOpen` is true. Use a two-phase render:
- Phase 1: Mount with `translate-y-full` (one frame)
- Phase 2: Next rAF, switch to `translate-y-0` (triggers transition)

Add `onTransitionEnd` to clean up. This guarantees the CSS transition fires every time.

Also add `touch-action: none` on backdrop and proper `will-change: transform` for GPU acceleration.

### 2. AnalysisLoadingState — Add completion state

Pass `isComplete` prop from Index. When analysis finishes (before drawer opens):
- Progress jumps to 100%
- All steps show checkmarks
- Brief 400ms delay, then drawer opens

This gives visual feedback that analysis completed before transitioning to results.

### 3. Index.tsx — Sequenced transition

Current flow: analysis completes → immediately set `analysisDrawerOpen = true`
New flow: analysis completes → set loading progress to 100% → wait 500ms → open drawer

This prevents the loading exit and drawer enter from colliding.

Also close drawer explicitly when starting a new analysis (`setAnalysisDrawerOpen(false)` in `handleMatchSelect`).

## Files to Change

| File | Change |
|------|--------|
| `src/components/analysis/AnalysisDrawer.tsx` | Mount/unmount pattern with rAF two-phase transition, will-change, GPU hints |
| `src/components/analysis/AnalysisLoadingState.tsx` | Add `isComplete` prop, 100% completion state |
| `src/pages/Index.tsx` | Sequenced loading→drawer transition with 500ms delay, close drawer on new analysis |

