import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { Session } from '@supabase/supabase-js';

const KEY = 'golmetrik_auth_backup';

export const isNativeApp = () => Capacitor.isNativePlatform();

export async function saveNativeSession(session: Session | null) {
  if (!isNativeApp() || !session) return;
  try {
    await Preferences.set({
      key: KEY,
      value: JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }),
    });
  } catch {}
}

export async function loadNativeSession(): Promise<{ access_token: string; refresh_token: string } | null> {
  if (!isNativeApp()) return null;
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return null;
    const parsed = JSON.parse(value);
    return parsed?.refresh_token ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearNativeSession() {
  if (!isNativeApp()) return;
  try { await Preferences.remove({ key: KEY }); } catch {}
}
