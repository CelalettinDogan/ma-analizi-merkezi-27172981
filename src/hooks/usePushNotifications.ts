import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Capacitor Push Notifications hook
 * - Registers for push on native platforms
 * - Saves FCM token to push_tokens table
 * - Handles foreground notifications (toast)
 * - Handles notification tap (deep link)
 */
export const usePushNotifications = (onNavigate?: (path: string) => void) => {
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user || registered.current) return;

    const setup = async () => {
      try {
        // Check / request permission
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('Push notification permission not granted');
          return;
        }

        // Register with FCM
        await PushNotifications.register();
        registered.current = true;
      } catch (err) {
        console.error('Push notification setup error:', err);
      }
    };

    // Listener: registration success → save token
    const regListener = PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push token received:', token.value.substring(0, 20) + '...');

      try {
        // Upsert token for this user
        const { error } = await supabase
          .from('push_tokens')
          .upsert(
            {
              user_id: user.id,
              token: token.value,
              platform: 'android',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.error('Error saving push token:', error);
        }
      } catch (e) {
        console.error('Error saving push token:', e);
      }
    });

    // Listener: registration error
    const regErrorListener = PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    // Listener: foreground notification → show toast
    const fgListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        toast(notification.title || 'GolMetrik', {
          description: notification.body,
          duration: 5000,
        });
      }
    );

    // Listener: notification tapped → navigate
    const tapListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        const data = action.notification.data;
        if (data?.path && onNavigate) {
          onNavigate(data.path);
        }
      }
    );

    setup();

    return () => {
      regListener.then(l => l.remove());
      regErrorListener.then(l => l.remove());
      fgListener.then(l => l.remove());
      tapListener.then(l => l.remove());
    };
  }, [user, onNavigate]);
};

export default usePushNotifications;
