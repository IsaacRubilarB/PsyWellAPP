import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.psywell.app',
  appName: 'PsyWell',
  webDir: 'www',
  bundledWebRuntime: true,
  server: {
    url: 'http://localhost:4200',
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      clientId: '471287872717-uonv4m9k2h6llpf0r7md4l9tca5rvk7t.apps.googleusercontent.com',
    },
  },
};

export default config;
