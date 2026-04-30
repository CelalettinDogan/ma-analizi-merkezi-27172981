import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

type Strength = 'light' | 'medium' | 'heavy';

const styleMap: Record<Strength, ImpactStyle> = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
};

/**
 * Tiny native-haptic helper. No-op on web / when plugin unavailable.
 * Usage: const tap = useHapticTap('light'); <button onClick={() => { tap(); ... }} />
 */
export const useHapticTap = (strength: Strength = 'light') => {
  return useCallback(() => {
    if (!Capacitor.isNativePlatform()) return;
    Haptics.impact({ style: styleMap[strength] }).catch(() => {
      /* swallow — haptics are non-critical */
    });
  }, [strength]);
};

export default useHapticTap;
