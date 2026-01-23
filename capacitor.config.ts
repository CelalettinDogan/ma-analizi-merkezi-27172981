import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a043c35180f74404bfb04355af0b4d37',
  appName: 'Gol Metrik',
  webDir: 'dist',
  server: {
    // Development mode - connects to Lovable preview
    // Remove this entire 'server' block for production builds
    url: 'https://a043c351-80f7-4404-bfb0-4355af0b4d37.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f172a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#22c55e',
      launchShowDuration: 2000,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Disable in production
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
