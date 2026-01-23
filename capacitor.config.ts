import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.golmetrik.android',
  appName: 'Gol Metrik',
  webDir: 'dist',
  // NOTE: For development, uncomment the server block below
  // server: {
  //   url: 'https://a043c351-80f7-4404-bfb0-4355af0b4d37.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
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
    allowMixedContent: false, // PRODUCTION: Disable mixed content
    captureInput: true,
    webContentsDebuggingEnabled: false, // PRODUCTION: Disable debugging
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
