import { Capacitor } from '@capacitor/core';

/**
 * Bu uygulama SADECE Android platformunda çalışır.
 * Web ve iOS desteği bulunmamaktadır.
 */
interface UsePlatformReturn {
  platform: 'android';
  isNative: boolean;
  isAndroid: boolean;
}

export const usePlatform = (): UsePlatformReturn => {
  // Bu uygulama sadece Android'de çalışır
  // Capacitor her zaman native olarak algılanacak
  const isNative = Capacitor.isNativePlatform();
  
  return {
    platform: 'android',
    isNative: isNative || true, // Dev modunda bile Android gibi davran
    isAndroid: true,
  };
};
