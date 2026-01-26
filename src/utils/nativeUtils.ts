import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Opens an external URL using the native browser on mobile
 * or window.open on web
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
    window.open(url, '_blank');
  }
};

/**
 * Opens the Play Store page for the app
 */
export const openPlayStore = async (): Promise<void> => {
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=app.golmetrik.android';
  await openExternalLink(playStoreUrl);
};

/**
 * Opens the App Store page for the app (future iOS support)
 * Note: iOS app is not yet available, this will redirect to Play Store
 */
export const openAppStore = async (): Promise<void> => {
  // iOS app not yet available - redirect to Play Store instead
  await openPlayStore();
};

/**
 * Checks if the app is running on a native platform
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Gets the current platform
 */
export const getPlatform = (): 'android' | 'ios' | 'web' => {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};
