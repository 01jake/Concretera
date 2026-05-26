import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.concretera.app',
  appName: 'Concretera',
  webDir: 'dist/concretera-web/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;