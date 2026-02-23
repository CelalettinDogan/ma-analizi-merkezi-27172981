
# Tab Navigation Fix - Premium Redirect Breaking TabShell

## Root Cause

The Premium page (`src/pages/Premium.tsx`, line 124) contains:
```text
if (isPremium || isAdmin) return <Navigate to="/profile" replace />;
```

Since TabShell mounts ALL 6 tab pages simultaneously (including Premium), the `<Navigate>` component fires immediately on mount, redirecting the entire app to `/profile` regardless of which tab the user selected. This makes tab switching completely non-functional for Admin and Premium users.

## Fix

Any page rendered inside TabShell must NOT use `<Navigate>` or programmatic redirects, because they are always mounted. Instead, these pages should render a fallback UI or nothing when the user shouldn't see them.

### Changes

**File: `src/pages/Premium.tsx` (line 124)**

Replace the `<Navigate to="/profile" replace />` with a simple inline fallback message (or empty div), since TabShell hides this page via `display: none` anyway when it's not the active tab. When the user IS on the Premium tab but is already premium/admin, show a brief "already subscribed" card instead of redirecting.

```text
// BEFORE:
if (isPremium || isAdmin) return <Navigate to="/profile" replace />;

// AFTER:
if (isPremium || isAdmin) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center p-6">
          <Crown className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Zaten Premium</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'Admin olarak tum ozelliklere erisebilirsiniz.' : 'Premium aboneliginiz aktif.'}
          </p>
        </Card>
      </main>
    </div>
  );
}
```

This prevents the redirect while still providing meaningful UI if the Premium tab is somehow visible.

### Additional Safety Check

Search all tab pages for similar `<Navigate>` usage that could cause the same issue. Based on my search, only Premium.tsx has this pattern among the tab pages.

## Files to Change

| File | Change |
|------|--------|
| `src/pages/Premium.tsx` | Replace `<Navigate>` redirect with inline fallback UI |

## Result

- Tab navigation will work correctly for all user types
- No more forced redirect to `/profile` on app load
- All 6 tabs remain safely mounted without side effects
- Premium/Admin users see a friendly message on Premium tab (though the tab is already hidden from BottomNav for them)
