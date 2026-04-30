import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Flame, Trophy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Capacitor } from '@capacitor/core';
import {
  getNotificationPrefs,
  setNotificationPrefs,
  useLocalNotifications,
  type NotificationPrefs,
} from '@/hooks/useLocalNotifications';
import { useTranslation } from 'react-i18next';

const NotificationSettings: React.FC = () => {
  const { t } = useTranslation('common');
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    matchReminders: true,
    streakReminders: true,
  });
  const [loaded, setLoaded] = useState(false);
  const { scheduleNotifications } = useLocalNotifications();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setLoaded(true);
      return;
    }
    getNotificationPrefs().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  const handleToggle = async (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await setNotificationPrefs(updated);
    // Re-schedule with new preferences
    scheduleNotifications();
  };

  if (!loaded) return null;

  const isNative = Capacitor.isNativePlatform();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-card/60 backdrop-blur-sm border border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {t('settings.notifications', 'Bildirimler')}
            </span>
          </div>

          {!isNative && (
            <p className="text-xs text-muted-foreground">
              Bildirimler sadece mobil uygulamada çalışır.
            </p>
          )}

          <div className="space-y-3">
            {/* Match reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Maç Hatırlatmaları
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Her gün 18:00'de bugünün maçları
                  </p>
                </div>
              </div>
              <Switch
                checked={prefs.matchReminders}
                onCheckedChange={() => handleToggle('matchReminders')}
                disabled={!isNative}
              />
            </div>

            {/* Streak reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Seri Hatırlatmaları
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Her gün 20:00'de serini koru
                  </p>
                </div>
              </div>
              <Switch
                checked={prefs.streakReminders}
                onCheckedChange={() => handleToggle('streakReminders')}
                disabled={!isNative}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSettings;
