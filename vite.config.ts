import path from 'node:path'
import { fileURLToPath } from 'node:url'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    legacy({
      targets: ['ios >= 9'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        id: 'clock-dashboard',
        name: '天气时钟',
        short_name: '天气时钟',
        description: '一个简约的在线天气时钟',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        icons: [
          {
            src: 'favicon/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'favicon/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'favicon/web-app-manifest-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'favicon/web-app-manifest-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/1.png',
            sizes: '2048x1536',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: 'screenshots/5.png',
            sizes: '2532x1170',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
