import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const LOVABLE_CLOUD_URL = 'https://id-preview--a043c351-80f7-4404-bfb0-4355af0b4d37.lovable.app';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Only set isLoading=false from listener AFTER initialization
        if (initialized.current) {
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session — this is the authoritative init
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      initialized.current = true;
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error: error as Error | null, data };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      // Native: Manuel OAuth URL + harici tarayıcı
      try {
      const nonce = crypto.getRandomValues(new Uint8Array(16))
          .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

        // Embed native flag in state parameter instead of redirect_uri
        const state = `native:${nonce}`;

        const params = new URLSearchParams({
          provider: 'google',
          redirect_uri: `${LOVABLE_CLOUD_URL}/callback`,
          state,
        });

        const oauthUrl = `${LOVABLE_CLOUD_URL}/~oauth/initiate?${params}`;
        await Browser.open({ url: oauthUrl });
        // Native'de harici tarayıcı açıldı — uygulama arka plana geçecek
        // DeepLinkHandler token'ları yakalayıp oturumu kuracak
        return { error: null };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    } else {
      // Web: Lovable Cloud managed OAuth
      const redirectUri = window.location.origin;
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUri,
      });
      return { error: error as Error | null };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    // Clear cached role/premium data for clean next-user experience
    try {
      localStorage.removeItem('nav_access_cache');
      localStorage.removeItem('cached_user_roles');
      localStorage.removeItem('cached_premium_sub');
    } catch {}
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
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
