import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { saveNativeSession, loadNativeSession, clearNativeSession, isNativeApp } from '@/lib/nativeSessionStore';

const PUBLISHED_URL = 'https://golmetrikapp.lovable.app';
const NATIVE_SCHEME = 'golmetrik://';

const getRedirectUrl = (path: string) => {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_SCHEME}${path}`;
  }
  return `${PUBLISHED_URL}/${path}`;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);
  const userSignedOut = useRef(false);
  const restoring = useRef<Promise<boolean> | null>(null);

  // Restore from native backup (single-flight to avoid refresh-token reuse revocation)
  const restoreFromBackup = () => {
    if (restoring.current) return restoring.current;
    restoring.current = (async () => {
      const backup = await loadNativeSession();
      if (!backup) return false;
      const { data, error } = await supabase.auth.setSession(backup);
      if (error) {
        // Only discard backup when the server truly rejected it
        const msg = (error.message || '').toLowerCase();
        const isNetwork = msg.includes('fetch') || msg.includes('network') || (error as any).status === 0;
        if (!isNetwork) await clearNativeSession();
        return false;
      }
      return !!data.session;
    })().finally(() => { restoring.current = null; });
    return restoring.current;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' && !userSignedOut.current && isNativeApp()) {
          // Unexpected sign-out: try the native backup before giving up
          setTimeout(() => {
            restoreFromBackup().then((ok) => {
              if (!ok) { setSession(null); setUser(null); }
            });
          }, 0);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session) saveNativeSession(session);
        if (event === 'SIGNED_OUT') clearNativeSession();
        if (initialized.current) setIsLoading(false);
      }
    );

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let s = session;
      if (!s && isNativeApp()) {
        if (await restoreFromBackup()) s = (await supabase.auth.getSession()).data.session;
      }
      setSession(s);
      setUser(s?.user ?? null);
      if (s) saveNativeSession(s);
      initialized.current = true;
      setIsLoading(false);
    })();

    // Foreground/background refresh handling on native
    let removeListener: (() => void) | undefined;
    if (isNativeApp()) {
      const h = CapApp.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          supabase.auth.startAutoRefresh();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { await restoreFromBackup(); return; }
          const expMs = (session.expires_at ?? 0) * 1000;
          if (expMs - Date.now() < 5 * 60 * 1000) await supabase.auth.refreshSession();
        } else {
          supabase.auth.stopAutoRefresh();
        }
      });
      removeListener = () => { h.then((x) => x.remove()); };
    }

    return () => { subscription.unsubscribe(); removeListener?.(); };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl('callback'),
        data: {
          display_name: displayName,
        },
      },
    });
    return { error: error as Error | null, data };
  };

  const signIn = async (email: string, password: string) => {
    userSignedOut.current = false;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    userSignedOut.current = true;
    setUser(null);
    setSession(null);
    try {
      localStorage.removeItem('nav_access_cache');
      localStorage.removeItem('cached_user_roles');
      localStorage.removeItem('cached_premium_sub');
    } catch {}
    await clearNativeSession();
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl('reset-password'),
    });
    return { error: error as Error | null };
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
