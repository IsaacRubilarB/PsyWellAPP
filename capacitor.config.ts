import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.psywell.app',
  appName: 'PsyWell',
  webDir: 'www',
  bundledWebRuntime: true,
  server: {
    url: 'http://192.168.56.1:3000',
    cleartext: true
  }
};

export default config;
