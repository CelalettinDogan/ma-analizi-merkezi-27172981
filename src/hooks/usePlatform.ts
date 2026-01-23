import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'android' | 'ios' | 'web';

interface UsePlatformReturn {
  platform: Platform;
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
}

export const usePlatform = (): UsePlatformReturn => {
  const [platformInfo, setPlatformInfo] = useState<UsePlatformReturn>(() => {
    // Initial state - default to web during SSR
    return {
      platform: 'web',
      isNative: false,
      isAndroid: false,
      isIOS: false,
      isWeb: true,
    };
  });

  useEffect(() => {
    const detectPlatform = () => {
      try {
        const isNative = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform() as Platform;
        
        setPlatformInfo({
          platform,
          isNative,
          isAndroid: platform === 'android',
          isIOS: platform === 'ios',
          isWeb: platform === 'web',
        });
      } catch {
        // Fallback if Capacitor is not available
        setPlatformInfo({
          platform: 'web',
          isNative: false,
          isAndroid: false,
          isIOS: false,
          isWeb: true,
        });
      }
    };

    detectPlatform();
  }, []);

  return platformInfo;
};
