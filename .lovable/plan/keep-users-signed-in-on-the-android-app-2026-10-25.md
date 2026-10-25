# Keep users signed in on the Android app

## Is it happening today?
It can. The login is saved only in the app's web storage. On Android, that storage can be cleared when the phone runs low on space or memory, or after an app update. The session also stops renewing itself while the app is in the background. If the app is closed for a few days, the next launch can find an expired session, fail to renew it, and send the user back to the login screen.

## What will change
1. **Lasting native storage:** The login is also saved to the phone's own storage (Capacitor Preferences). Android does not clear this. When the app opens and the web storage is empty, the session is restored from there automatically.
2. **Renewal on resume:** When the app comes back to the foreground, it renews the session immediately. Automatic renewal pauses in the background so the phone doesn't waste battery.
3. **No logout on network errors:** If renewal fails because there is no internet or the server doesn't respond, the user stays signed in and the app tries again later. The user is signed out only when they press "Sign out" or the server actually rejects the login.
4. **Single renewal at a time:** If several renewal requests start at once, the first one can invalidate the others. That can unexpectedly end the session, so only one renewal runs at a time.

## Technical details
- New `src/lib/nativeSessionStore.ts` uses `@capacitor/preferences`. It mirrors the session on `onAuthStateChange` (SIGNED_IN, TOKEN_REFRESHED) and clears it on SIGNED_OUT.
- `AuthContext` bootstrap: `getSession()`. If there is no session and the app is running on native, read Preferences, then `supabase.auth.setSession({access_token, refresh_token})`. `isLoading` stays true until this finishes, so the user doesn't see the auth screen for a moment.
- `App.addListener('appStateChange')`: active → `startAutoRefresh()` + `refreshSession()` if the token expires within 5 minutes. Background → `stopAutoRefresh()`.
- A SIGNED_OUT event that the user did not trigger (an explicit `signOut` sets a flag) is ignored if the native copy still exists and the error is a network error. The app retries with the backup instead.
- The current `signOut` flow already clears storage before logging out. It will also remove the Preferences key.
- Verification: check that the session survives an emptied web storage, both in Playwright and with a session restore test.
- After this, run `npm i @capacitor/preferences` and `npx cap sync android`.
