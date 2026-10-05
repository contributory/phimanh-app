import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // base relative: bat buoc de chay tren file:///android_asset (Capacitor)
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 8100 },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
});
