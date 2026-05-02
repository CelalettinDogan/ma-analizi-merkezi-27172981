import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Flame, Trophy, ShieldCheck, ShieldAlert, ShieldQuestion, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  getNotificationPrefs,
  setNotificationPrefs,
  useLocalNotifications,
  type NotificationPrefs,
} from '@/hooks/useLocalNotifications';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

type PermissionStatus = 'granted' | 'prompt' | 'denied' | 'loading';

const NotificationSettings: React.FC = () => {
  const { t } = useTranslation('profile');
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    matchReminders: true,
    streakReminders: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [permStatus, setPermStatus] = useState<PermissionStatus>('loading');
  const { scheduleNotifications } = useLocalNotifications();
  const isNative = Capacitor.isNativePlatform();

  const checkPermission = useCallback(async () => {
    if (!isNative) {
      setPermStatus('prompt');
      return;
    }
    try {
      const result = await LocalNotifications.checkPermissions();
      setPermStatus(result.display as PermissionStatus);
    } catch {
      setPermStatus('prompt');
    }
  }, [isNative]);

  useEffect(() => {
    checkPermission();
    if (!isNative) {
      setLoaded(true);
      return;
    }
    getNotificationPrefs().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, [isNative, checkPermission]);

  const handleRequestPermission = async () => {
    if (!isNative) return;
    try {
      const result = await LocalNotifications.requestPermissions();
      setPermStatus(result.display as PermissionStatus);
      if (result.display === 'granted') {
        toast.success(t('notifications.permissionGranted'));
        scheduleNotifications();
      } else if (result.display === 'denied') {
        toast.error(t('notifications.permissionDenied'));
      }
    } catch {
      toast.error(t('notifications.permissionFailed'));
    }
  };

  const handleOpenSettings = async () => {
    // On Android, open app notification settings via intent
    try {
      const { App } = await import('@capacitor/app');
      // getInfo gives us the package name for building the intent
      const info = await App.getInfo();
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({
        url: `app-settings:`,
        presentationStyle: 'popover',
      });
    } catch {
      // Fallback: just inform user
      toast(t('notifications.settingsHint'));
    }
  };

  const handleToggle = async (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await setNotificationPrefs(updated);
    scheduleNotifications();
  };

  if (!loaded) return null;

  const isDenied = permStatus === 'denied';
  const isGranted = permStatus === 'granted';
  const isPrompt = permStatus === 'prompt';

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
              {t('notifications.title')}
            </span>
          </div>

          {/* Permission Status Banner */}
          <AnimatePresence mode="wait">
            {permStatus !== 'loading' && (
              <motion.div
                key={permStatus}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isGranted && isNative && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-400">
                      {t('notifications.activeMessage')}
                    </p>
                  </div>
                )}

                {isPrompt && isNative && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldQuestion className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-400">
                        {t('notifications.promptMessage')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      onClick={handleRequestPermission}
                    >
                      {t('notifications.enable')}
                    </Button>
                  </div>
                )}

                {isDenied && isNative && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-red-400">
                        {t('notifications.deniedMessage')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs border-destructive/30 text-red-400 hover:bg-destructive/10"
                      onClick={handleOpenSettings}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      {t('notifications.openSettings')}
                    </Button>
                  </div>
                )}

                {!isNative && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border/30">
                    <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {t('notifications.webOnly')}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {/* Match reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('notifications.matchTitle')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('notifications.matchDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={prefs.matchReminders}
                onCheckedChange={() => handleToggle('matchReminders')}
                disabled={!isNative || isDenied}
              />
            </div>

            {/* Streak reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('notifications.streakTitle')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('notifications.streakDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={prefs.streakReminders}
                onCheckedChange={() => handleToggle('streakReminders')}
                disabled={!isNative || isDenied}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSettings;
