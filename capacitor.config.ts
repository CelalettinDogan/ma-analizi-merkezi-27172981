import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.golmetrik.android',
  appName: 'GolMetrik',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'golmetrik.app',
  },
  // NOTE: For development with hot reload, uncomment below:
  // server: {
  //   url: 'https://a043c351-80f7-4404-bfb0-4355af0b4d37.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f172a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      launchShowDuration: 2000,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SocialLogin: {
      google: {
        webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      },
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0f172a',
    initialFocus: false,
    useLegacyBridge: false,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0f172a',
  },
};

export default config;
