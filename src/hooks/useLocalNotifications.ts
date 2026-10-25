import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOn } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStreak } from '@/hooks/useStreak';
import {
  pickFavoriteMatches,
  pickUnpickedArenaMatch,
  reminderTimeFor,
} from '@/lib/reminderPlanner';

// Notification IDs (stable, prevents duplicates)
const NOTIFICATION_IDS = {
  DAILY_MATCH: 1001,
  STREAK_REMINDER: 1002,
  WEEKLY_SUMMARY: 1003,
  ARENA_WEEKLY: 1004,
};

// Dynamic one-off reminders use these id ranges and are re-scheduled fresh
// every time the app opens/resumes or favorites change.
const FAVORITE_ID_BASE = 2000;
const ARENA_ID_BASE = 3000;
const DYNAMIC_CANCEL_IDS = [
  ...Array.from({ length: 10 }, (_, i) => ({ id: FAVORITE_ID_BASE + i })),
  ...Array.from({ length: 10 }, (_, i) => ({ id: ARENA_ID_BASE + i })),
];

export interface NotificationPrefs {
  matchReminders: boolean;
  streakReminders: boolean;
  arenaReminders: boolean;
}

const PREFS_KEY = 'notification_preferences';

const DEFAULT_PREFS: NotificationPrefs = {
  matchReminders: true,
  streakReminders: true,
  arenaReminders: true,
};

export const getNotificationPrefs = async (): Promise<NotificationPrefs> => {
  try {
    const { value } = await Preferences.get({ key: PREFS_KEY });
    if (value) {
      const parsed = JSON.parse(value);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
};

export const setNotificationPrefs = async (prefs: NotificationPrefs) => {
  await Preferences.set({ key: PREFS_KEY, value: JSON.stringify(prefs) });
};

/**
 * Ensures notification permission + Android channel exist.
 * Safe to call multiple times. Returns final permission status.
 */
export const ensureNotificationPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  if (!Capacitor.isNativePlatform()) return 'prompt';
  try {
    const current = await LocalNotifications.checkPermissions();
    let display = current.display;

    if (display === 'prompt' || display === 'prompt-with-rationale') {
      const req = await LocalNotifications.requestPermissions();
      display = req.display;
    }

    if (display === 'granted') {
      try {
        await LocalNotifications.createChannel({
          id: 'golmetrik_reminders',
          name: 'Hatırlatmalar',
          description: 'Maç ve seri hatırlatmaları',
          importance: 4,
          sound: 'default',
          vibration: true,
        });
      } catch {
        // channel may already exist
      }
      return 'granted';
    }
    return display === 'denied' ? 'denied' : 'prompt';
  } catch (err) {
    console.warn('ensureNotificationPermission error:', err);
    return 'prompt';
  }
};

export const useLocalNotifications = () => {
  const { user } = useAuth();
  const { streak } = useStreak();
  const permissionRequested = useRef(false);

  const scheduleNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const status = await ensureNotificationPermission();
      if (status !== 'granted') return;

      // Cancel existing scheduled notifications to re-schedule fresh
      await LocalNotifications.cancel({
        notifications: Object.values(NOTIFICATION_IDS).map((id) => ({ id })),
      });

      const prefs = await getNotificationPrefs();
      const notifications: any[] = [];

      // 1. Daily match reminder at 18:00
      if (prefs.matchReminders) {
        notifications.push({
          id: NOTIFICATION_IDS.DAILY_MATCH,
          title: '⚽ Bugünün Maçları',
          body: 'Bugünün maçlarını analiz ettin mi? Hemen tahminini yap!',
          schedule: {
            on: { hour: 18, minute: 0 } as ScheduleOn,
            allowWhileIdle: true,
            repeats: true,
          },
          channelId: 'golmetrik_reminders',
          smallIcon: 'ic_launcher',
          actionTypeId: 'OPEN_APP',
          extra: { path: '/' },
        });
      }

      // 2. Streak reminder at 20:00 (only if user has an active streak)
      if (prefs.streakReminders && streak.current_streak > 0) {
        const streakMsg =
          streak.current_streak >= 5
            ? `🔥 ${streak.current_streak} günlük serin harika! Bugün de devam et!`
            : `🔥 ${streak.current_streak} günlük serini kırma! Bugün giriş yap.`;

        notifications.push({
          id: NOTIFICATION_IDS.STREAK_REMINDER,
          title: 'Seri Hatırlatması',
          body: streakMsg,
          schedule: {
            on: { hour: 20, minute: 0 } as ScheduleOn,
            allowWhileIdle: true,
            repeats: true,
          },
          channelId: 'golmetrik_reminders',
          smallIcon: 'ic_launcher',
          actionTypeId: 'OPEN_APP',
          extra: { path: '/' },
        });
      }

      // 3. Weekly summary — Monday at 10:00
      if (prefs.matchReminders) {
        notifications.push({
          id: NOTIFICATION_IDS.WEEKLY_SUMMARY,
          title: '📊 Haftalık Özet',
          body: 'Geçen haftanın tahmin sonuçlarına göz at!',
          schedule: {
            on: { hour: 10, minute: 0, weekday: 2 } as ScheduleOn,
            allowWhileIdle: true,
            repeats: true,
          },
          channelId: 'golmetrik_reminders',
          smallIcon: 'ic_launcher',
          actionTypeId: 'OPEN_APP',
          extra: { path: '/profile' },
        });
      }

      // 4. Arena weekly kickoff — Monday at 12:00
      if (prefs.arenaReminders) {
        notifications.push({
          id: NOTIFICATION_IDS.ARENA_WEEKLY,
          title: '🏟️ Arena Yeni Hafta',
          body: 'Yeni Arena haftası başladı! 5 büyük maçta tahminini yap, haftanın zirvesine oyna.',
          schedule: {
            on: { hour: 12, minute: 0, weekday: 2 } as ScheduleOn,
            allowWhileIdle: true,
            repeats: true,
          },
          channelId: 'golmetrik_reminders',
          smallIcon: 'ic_launcher',
          actionTypeId: 'OPEN_APP',
          extra: { path: '/arena' },
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} local notifications`);
      }
    } catch (err) {
      console.error('Local notification scheduling error:', err);
    }
  }, [streak.current_streak]);

  /**
   * Dynamic one-off reminders: favourite-team match-day (kickoff − 2h, next 7
   * days, max 3) and the user's first unpicked Arena match (kickoff − 2h).
   */
  const scheduleDynamicNotifications = useCallback(async () => {
    if (!user || !Capacitor.isNativePlatform()) return;

    try {
      const status = await ensureNotificationPermission();
      if (status !== 'granted') return;

      try {
        await LocalNotifications.cancel({ notifications: DYNAMIC_CANCEL_IDS });
      } catch {
        // nothing scheduled yet
      }

      const prefs = await getNotificationPrefs();
      const now = new Date();
      const notifications: any[] = [];

      // Favourite teams: next 7 days, up to 3 reminders
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('favorite_id, favorite_name')
        .eq('user_id', user.id)
        .eq('favorite_type', 'team');

      const teamIds = (favorites ?? []).map((f) => String(f.favorite_id)).filter(Boolean);
      const teamNames = (favorites ?? [])
        .map((f) => f.favorite_name)
        .filter((n): n is string => !!n);

      if (teamIds.length > 0 || teamNames.length > 0) {
        const { data: matches } = await supabase
          .from('cached_matches')
          .select(
            'match_id, home_team_name, away_team_name, home_team_id, away_team_id, utc_date, status',
          )
          .in('status', ['TIMED', 'SCHEDULED'])
          .gte('utc_date', now.toISOString())
          .lte('utc_date', new Date(now.getTime() + 7 * 86_400_000).toISOString())
          .order('utc_date', { ascending: true })
          .limit(100);

        const selected = pickFavoriteMatches(matches ?? [], { ids: teamIds, names: teamNames }, now);
        selected.slice(0, 3).forEach((m, i) => {
          const at = reminderTimeFor(m.utc_date, now);
          if (!at) return;
          notifications.push({
            id: FAVORITE_ID_BASE + i,
            title: '⏰ Favori Maç Yaklaşıyor',
            body: `${m.home_team_name} - ${m.away_team_name} yaklaşık 2 saat sonra başlıyor. Analizini hazırla!`,
            schedule: { at, allowWhileIdle: true },
            channelId: 'golmetrik_reminders',
            smallIcon: 'ic_launcher',
            actionTypeId: 'OPEN_APP',
            extra: { path: '/' },
          });
        });
      }

      // Arena: reminder for the first upcoming match the user has not picked
      if (prefs.arenaReminders) {
        const { data: weekData } = await supabase.rpc('get_arena_week' as any);
        const arenaMatches = ((weekData as any)?.matches ?? []) as any[];
        const unpicked = pickUnpickedArenaMatch(arenaMatches, now);
        if (unpicked) {
          const at = reminderTimeFor(unpicked.utc_date, now);
          if (at) {
            const home = unpicked.home ?? unpicked.home_team_name;
            const away = unpicked.away ?? unpicked.away_team_name;
            notifications.push({
              id: ARENA_ID_BASE,
              title: '🏟️ Arena Tahmini Bekliyor',
              body: `${home} - ${away} maçında tahminini yapmadın! Maç başlamadan seç ve puan kazan.`,
              schedule: { at, allowWhileIdle: true },
              channelId: 'golmetrik_reminders',
              smallIcon: 'ic_launcher',
              actionTypeId: 'OPEN_APP',
              extra: { path: '/arena' },
            });
          }
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} dynamic local notifications`);
      }
    } catch (err) {
      console.error('Dynamic notification scheduling error:', err);
    }
  }, [user?.id]);

  // Request permission ASAP on app launch (independent of auth).
  // Android shows the system dialog only on the first request, so do this early.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (permissionRequested.current) return;
    permissionRequested.current = true;

    const timer = setTimeout(() => {
      ensureNotificationPermission().catch((err) =>
        console.warn('Initial permission request failed:', err),
      );
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Schedule notifications once user is logged in (and re-schedule when streak changes).
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;
    const timer = setTimeout(() => {
      scheduleNotifications();
      scheduleDynamicNotifications();
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, scheduleNotifications, scheduleDynamicNotifications]);

  // Re-schedule when the app comes back to the foreground (favorites, picks
  // and kickoff times may all have changed while the app was closed).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: Promise<{ remove: () => Promise<void> }> | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        handle = App.addListener('resume', () => {
          scheduleNotifications();
          scheduleDynamicNotifications();
        });
      } catch (err) {
        console.warn('App resume listener failed:', err);
      }
    })();

    return () => {
      handle?.then((h) => h.remove());
    };
  }, [scheduleNotifications, scheduleDynamicNotifications]);

  // Handle notification tap → deep link
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        const path = action.notification.extra?.path;
        if (path) {
          window.location.hash = path;
        }
      },
    );

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  return { scheduleNotifications, scheduleDynamicNotifications, ensureNotificationPermission };
};

export default useLocalNotifications;
