import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { STORE_LINKS } from '@/hooks/usePlatformPremium';

/**
 * Bu uygulama SADECE Android platformunda çalışır.
 * Tüm native işlemler Android'e özeldir.
 */

/**
 * Opens an external URL using the native browser on mobile
 * or window.open on web (dev mode)
 */
export const openExternalLink = async (url: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url });
    } catch (error) {
      console.error('Failed to open browser:', error);
      // Fallback to window.open
      window.open(url, '_blank');
    }
  } else {
    // Development mode - open in new tab
    window.open(url, '_blank');
  }
};

/**
 * Opens the Play Store page for the app
 */
export const openPlayStore = async (): Promise<void> => {
  await openExternalLink(STORE_LINKS.playStore);
};

/**
 * Checks if the app is running on a native platform
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Gets the current platform (always returns 'android' for this app)
 */
export const getPlatform = (): 'android' => {
  return 'android';
};

/**
 * Uygulamadan çıkış yapar (Android geri tuşu için)
 */
export const exitApp = (): void => {
  if (Capacitor.isNativePlatform()) {
    App.exitApp();
  }
};

/**
 * Android geri tuşu handler'ı
 */
export const setupBackButtonHandler = (
  onBackPress: () => boolean
): (() => void) => {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const handler = App.addListener('backButton', ({ canGoBack }) => {
    const handled = onBackPress();
    if (!handled && !canGoBack) {
      App.exitApp();
    }
  });

  return () => {
    handler.then(h => h.remove());
  };
};
