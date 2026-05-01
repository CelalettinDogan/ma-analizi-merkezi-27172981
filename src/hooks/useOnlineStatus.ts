import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const PING_URL = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/health` : 'https://www.gstatic.com/generate_204';

const OFFLINE_DEBOUNCE_MS = 2500;
const RECHECK_INTERVAL_MS = 10000;
const PING_TIMEOUT_MS = 3000;

/**
 * Actively verify connectivity by pinging a known endpoint.
 * Returns true if reachable, false otherwise.
 */
const verifyConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    await fetch(PING_URL, {
      method: 'HEAD',
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timer);
    // no-cors: opaque response — fetch resolving means network reached the host
    return true;
  } catch {
    return false;
  }
};

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const clearOfflineTimer = () => {
    if (offlineTimerRef.current) {
      clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = null;
    }
  };

  const clearRecheckInterval = () => {
    if (recheckIntervalRef.current) {
      clearInterval(recheckIntervalRef.current);
      recheckIntervalRef.current = null;
    }
  };

  const setOnline = useCallback(() => {
    if (!mountedRef.current) return;
    clearOfflineTimer();
    clearRecheckInterval();
    setIsOnline(true);
  }, []);

  const scheduleOffline = useCallback(() => {
    if (!mountedRef.current) return;
    if (offlineTimerRef.current) return; // already scheduled

    offlineTimerRef.current = setTimeout(async () => {
      offlineTimerRef.current = null;
      // Verify before declaring offline — avoids false positives
      const reachable = await verifyConnection();
      if (!mountedRef.current) return;

      if (reachable) {
        setOnline();
        return;
      }

      setIsOnline(false);

      // Start polling to auto-recover
      if (!recheckIntervalRef.current) {
        recheckIntervalRef.current = setInterval(async () => {
          const ok = await verifyConnection();
          if (!mountedRef.current) return;
          if (ok) setOnline();
        }, RECHECK_INTERVAL_MS);
      }
    }, OFFLINE_DEBOUNCE_MS);
  }, [setOnline]);

  useEffect(() => {
    mountedRef.current = true;
    let networkListener: { remove: () => void } | null = null;

    // Web event listeners
    const handleWebOnline = () => setOnline();
    const handleWebOffline = () => scheduleOffline();
    window.addEventListener('online', handleWebOnline);
    window.addEventListener('offline', handleWebOffline);

    // Capacitor Network plugin (more reliable on Android)
    const setupNative = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        if (mountedRef.current) {
          if (status.connected) setOnline();
          else scheduleOffline();
        }
        const handle = await Network.addListener('networkStatusChange', (s) => {
          if (s.connected) setOnline();
          else scheduleOffline();
        });
        networkListener = handle;
      } catch (e) {
        // plugin unavailable — fall back to navigator.onLine
        console.warn('[useOnlineStatus] Capacitor Network unavailable', e);
      }
    };

    setupNative();

    // Initial sanity check: if navigator says offline at mount, verify before showing banner
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      scheduleOffline();
    }

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleWebOnline);
      window.removeEventListener('offline', handleWebOffline);
      clearOfflineTimer();
      clearRecheckInterval();
      networkListener?.remove();
    };
  }, [setOnline, scheduleOffline]);

  return isOnline;
};
