import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Streak Heartbeat:
 * - Refetch user streak whenever the app returns to foreground (Capacitor + web visibility).
 * - Detect UTC date change while app is open and refetch.
 * - Surface newly granted milestone rewards as a toast (one-shot per session per reward).
 */
export const useStreakHeartbeat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['rewards', 'streak']);
  const lastDateRef = useRef<string>(new Date().toISOString().slice(0, 10));
  const announcedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const refetchStreak = () => {
      queryClient.invalidateQueries({ queryKey: ['user-streak', user.id] });
      queryClient.invalidateQueries({ queryKey: ['bonus-credits', user.id] });
    };

    // Capacitor app resume
    let removeListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      const handle = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) refetchStreak();
      });
      removeListener = () => {
        handle.then((h) => h.remove());
      };
    }

    // Web visibility fallback
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetchStreak();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // UTC date change detector — every 60s
    const interval = window.setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== lastDateRef.current) {
        lastDateRef.current = today;
        refetchStreak();
      }
    }, 60_000);

    return () => {
      removeListener?.();
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [user, queryClient]);

  // Watch query data for newly granted rewards and announce them once per session
  useEffect(() => {
    if (!user) return;
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] !== 'user-streak') return;
      const data: any = event.query.state.data;
      const granted: any[] = data?.newly_granted ?? [];
      if (!Array.isArray(granted) || granted.length === 0) return;
      granted.forEach((r) => {
        const key = `${r.day}-${r.type}`;
        if (announcedRef.current.has(key)) return;
        announcedRef.current.add(key);
        toast.success(t('rewards:newReward'), {
          description: t(`rewards:day${r.day}`),
          duration: 5000,
        });
      });
    });
    return () => unsub();
  }, [user, queryClient, t]);
};

export default useStreakHeartbeat;
