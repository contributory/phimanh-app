import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.phimanh.app',
  appName: 'Phim Ảnh',
  webDir: 'dist',
  backgroundColor: '#070707',
  android: {
    allowMixedContent: true,
    // Cho phep player HLS/iframe chay tren Android WebView
    appendUserAgent: 'phimanh-mobile/1.0',
  },
  server: {
    // Cho phep cleartext stream HLS neu nguon khong co HTTPS
    cleartext: true,
  },
};

export default config;
