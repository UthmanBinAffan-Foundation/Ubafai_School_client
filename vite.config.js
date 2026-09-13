import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'UBAFAI Parent Portal',
        short_name: 'UBAFAI',
        description: 'Balance, bayad, at grades ng anak mo',
        id: '/',
        start_url: '/',
        scope: '/',
        theme_color: '#4c1d95',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  server: { port: 5173 },
});
