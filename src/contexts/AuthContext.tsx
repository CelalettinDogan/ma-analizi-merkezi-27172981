import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

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

/**
 * Native Android'de @capgo/capacitor-social-login kullanarak
 * harici tarayıcı açmadan Google Sign-In yapar.
 * Web/dev ortamında Lovable managed OAuth fallback kullanır.
 */
async function nativeGoogleSignIn(): Promise<{ error: Error | null }> {
  try {
    const { SocialLogin } = await import('@capgo/capacitor-social-login');

    // Native Google hesap seçiciyi aç
    const loginResult = await SocialLogin.login({
      provider: 'google',
      options: {},
    });

    const googleResult = loginResult?.result;
    const idToken = googleResult && 'idToken' in googleResult ? googleResult.idToken : null;

    if (!idToken) {
      return { error: new Error('Google kimlik doğrulama jetonu alınamadı.') };
    }

    // idToken ile Supabase oturumu başlat
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return { error: error as Error };
    }

    return { error: null };
  } catch (err: any) {
    // Kullanıcı iptal ettiyse
    if (err?.message?.includes('canceled') || err?.message?.includes('cancelled') || err?.code === '12501') {
      return { error: new Error('Google girişi iptal edildi.') };
    }
    console.error('Native Google Sign-In hatası:', err);
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Native platformda SocialLogin'i başlat
    if (Capacitor.isNativePlatform()) {
      import('@capgo/capacitor-social-login').then(({ SocialLogin }) => {
        SocialLogin.initialize({
          google: {
            webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
          },
        });
      }).catch(console.warn);
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
    // Native Android'de harici tarayıcı açmadan native Google Sign-In kullan
    if (Capacitor.isNativePlatform()) {
      return nativeGoogleSignIn();
    }

    // Web/dev ortamında Lovable managed OAuth fallback
    const redirectUri = window.location.origin;
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUri,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // State'i hemen temizle (race condition önlemi)
    setUser(null);
    setSession(null);

    // Native'de Google oturumunu da kapat
    if (Capacitor.isNativePlatform()) {
      try {
        const { SocialLogin } = await import('@capgo/capacitor-social-login');
        await SocialLogin.logout({ provider: 'google' });
      } catch (e) {
        console.warn('Google Sign-Out hatası:', e);
      }
    }
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
