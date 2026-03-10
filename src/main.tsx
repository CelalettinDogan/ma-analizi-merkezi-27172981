import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App.tsx";
import "./index.css";

// Counter-scaling: detect and neutralize Android system font scaling
function lockRootFontSize() {
  if (!document.body) return;
  const test = document.createElement('div');
  test.style.cssText = 'font-size:16px;position:absolute;visibility:hidden;pointer-events:none;left:-9999px';
  document.body.appendChild(test);
  const actual = parseFloat(getComputedStyle(test).fontSize);
  document.body.removeChild(test);

  if (actual && actual !== 16) {
    document.documentElement.style.fontSize = ((16 / actual) * 16) + 'px';
  } else {
    document.documentElement.style.fontSize = '16px';
  }
}

// Run on load, resize, visibility change
document.addEventListener('DOMContentLoaded', lockRootFontSize);
window.addEventListener('resize', lockRootFontSize);
document.addEventListener('visibilitychange', lockRootFontSize);
if (document.body) lockRootFontSize();

// Native platform initialization
const initializeNative = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
      
      // Hide splash screen after app is ready
      await SplashScreen.hide();
    } catch (error) {
      console.warn('Native initialization error:', error);
    }
  }
};

// Initialize native features
initializeNative();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
