

# Release Preparation Plan

## Current State
- `capacitor.config.ts`: Correct — `webDir: 'dist'`, production settings (no dev server URL, debugging disabled)
- `dvh` usage: **Zero instances found** — already clean
- `android/` directory: Does not exist in Lovable (generated locally via `npx cap add android`)

## Changes Needed

### 1. `android/app/build.gradle` — Version Bump
This file lives in your **local** Android project, not in Lovable. You need to edit it in Android Studio or your local editor:

```text
Find:    versionCode X
Replace: versionCode X+1

Find:    versionName "current"
Replace: versionName "next minor" (e.g., "1.1" → "1.2")
```

Lovable cannot edit this file since the `android/` directory is gitignored and generated locally.

### 2. Production Build Readiness
Everything is already correct:
- `npm run build` produces output in `dist/`
- `capacitor.config.ts` has `webDir: 'dist'` ✓
- No dev server URL active ✓
- `webContentsDebuggingEnabled: false` ✓

### 3. dvh CSS Usage
**No action needed** — zero `dvh` references found anywhere in the codebase. Already using `vh`-based utilities (`h-screen`, `min-h-screen`).

### 4. Release Checklist Summary
No code changes are required from Lovable. The project is release-ready.

**Your local workflow:**
```bash
git pull
npm install
npm run build
npx cap sync android
```
Then open Android Studio → `android/app/build.gradle` → bump `versionCode` and `versionName` → Generate Signed Bundle.

