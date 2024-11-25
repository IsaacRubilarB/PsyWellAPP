import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'psywell',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SamsungHealth: {}, // Registrar el plugin de Samsung Health
  },
};

export default config;
