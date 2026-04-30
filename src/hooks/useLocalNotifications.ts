import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOn } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from '@/contexts/AuthContext';
import { useStreak } from '@/hooks/useStreak';

// Notification IDs (stable, prevents duplicates)
const NOTIFICATION_IDS = {
  DAILY_MATCH: 1001,
  STREAK_REMINDER: 1002,
  WEEKLY_SUMMARY: 1003,
};

export interface NotificationPrefs {
  matchReminders: boolean;
  streakReminders: boolean;
}

const PREFS_KEY = 'notification_preferences';

const DEFAULT_PREFS: NotificationPrefs = {
  matchReminders: true,
  streakReminders: true,
};

export const getNotificationPrefs = async (): Promise<NotificationPrefs> => {
  try {
    const { value } = await Preferences.get({ key: PREFS_KEY });
    if (value) return JSON.parse(value);
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
};

export const setNotificationPrefs = async (prefs: NotificationPrefs) => {
  await Preferences.set({ key: PREFS_KEY, value: JSON.stringify(prefs) });
};

export const useLocalNotifications = () => {
  const { user } = useAuth();
  const { streak } = useStreak();
  const scheduled = useRef(false);

  const scheduleNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Request permission
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display !== 'granted') {
        console.log('Local notification permission not granted');
        return;
      }

      // Create notification channel for Android
      await LocalNotifications.createChannel({
        id: 'golmetrik_reminders',
        name: 'Hatırlatmalar',
        description: 'Maç ve seri hatırlatmaları',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
      });

      // Cancel existing scheduled notifications to re-schedule fresh
      await LocalNotifications.cancel({
        notifications: Object.values(NOTIFICATION_IDS).map(id => ({ id })),
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
        const streakMsg = streak.current_streak >= 5
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
            on: { hour: 10, minute: 0, weekday: 2 } as ScheduleOn, // Monday = 2 in Capacitor
            allowWhileIdle: true,
            repeats: true,
          },
          channelId: 'golmetrik_reminders',
          smallIcon: 'ic_launcher',
          actionTypeId: 'OPEN_APP',
          extra: { path: '/profile' },
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

  // Schedule on mount + when streak changes
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    // Small delay to avoid scheduling during initial app load
    const timer = setTimeout(() => {
      scheduleNotifications();
      scheduled.current = true;
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, scheduleNotifications]);

  // Handle notification tap → deep link
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        const path = action.notification.extra?.path;
        if (path) {
          // Navigate via window.location for simplicity in deep link
          window.location.hash = path;
        }
      }
    );

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return { scheduleNotifications };
};

export default useLocalNotifications;
