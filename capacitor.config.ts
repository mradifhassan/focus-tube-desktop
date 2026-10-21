import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focustube.app',
  appName: 'FocusTube',
  webDir: 'app',
  android: {
    // Android 15 (API 35) enforces edge-to-edge. Tell Capacitor to apply the
    // system-bar + display-cutout insets to the WebView so content is not drawn
    // underneath the status bar / gesture bar. The web layer also reads
    // env(safe-area-inset-*) for the navbar and bottom navigation.
    adjustMarginsForEdgeToEdge: 'auto'
  }
};

export default config;
