import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Button } from '@/components/ui/button';
import { ensureNotificationPermission } from '@/hooks/useLocalNotifications';
import { toast } from 'sonner';

const DISMISS_KEY = 'notif_prompt_shown_v1';

const NotificationOnboardingBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let mounted = true;

    (async () => {
      try {
        const dismissed = await Preferences.get({ key: DISMISS_KEY });
        if (dismissed.value === '1') return;
        const perm = await LocalNotifications.checkPermissions();
        if (mounted && perm.display !== 'granted') {
          setShow(true);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleEnable = async () => {
    const status = await ensureNotificationPermission();
    if (status === 'granted') {
      toast.success('Bildirimler aktif edildi');
      await Preferences.set({ key: DISMISS_KEY, value: '1' });
      setShow(false);
    } else if (status === 'denied') {
      toast.error('Bildirimler reddedildi. Telefon ayarlarından açabilirsin.');
      await Preferences.set({ key: DISMISS_KEY, value: '1' });
      setShow(false);
    }
  };

  const handleDismiss = async () => {
    await Preferences.set({ key: DISMISS_KEY, value: '1' });
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 backdrop-blur-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <Bell className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Bildirimleri aç</p>
            <p className="text-[11px] text-muted-foreground">
              Maç ve seri hatırlatmalarını kaçırma
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleEnable}
            className="h-8 shrink-0 bg-amber-500 text-amber-950 hover:bg-amber-400"
          >
            Aç
          </Button>
          <button
            onClick={handleDismiss}
            aria-label="Kapat"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationOnboardingBanner;
