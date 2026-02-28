import { useState, useEffect, useMemo } from 'react';
import { useAccessLevel } from './useAccessLevel';

const CACHE_KEY = 'nav_access_cache';

interface CachedAccessState {
  isAdmin: boolean;
  isPremium: boolean;
}

/**
 * BottomNav için optimize edilmiş erişim seviyesi hook'u.
 * 
 * localStorage'dan senkron okuma yaparak ilk frame'den itibaren
 * doğru navigasyon öğelerini render eder. Arka planda gerçek
 * verileri doğrular ve cache'i günceller.
 */
export const useCachedAccessLevel = () => {
  // Sync read from localStorage - available on first frame (0ms)
  const cached = useMemo((): CachedAccessState => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          isAdmin: !!parsed.isAdmin,
          isPremium: !!parsed.isPremium,
        };
      }
    } catch {
      // Corrupt cache, fall through to default
    }
    return { isAdmin: false, isPremium: false };
  }, []);

  const [state, setState] = useState<CachedAccessState>(cached);
  const real = useAccessLevel();

  useEffect(() => {
    if (!real.isLoading) {
      const next: CachedAccessState = {
        isAdmin: real.isAdmin,
        isPremium: real.isPremium,
      };
      // Update cache for next launch
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        // Storage full or unavailable, ignore
      }
      setState(next);
    }
  }, [real.isLoading, real.isAdmin, real.isPremium]);

  return {
    isAdmin: state.isAdmin,
    isPremium: state.isPremium,
    isResolved: !real.isLoading,
  };
};

/** Cache key exported for cleanup on signOut */
export const NAV_ACCESS_CACHE_KEY = CACHE_KEY;
