import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'// Swap this out for react() if you're using React!
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

// Every build is a new version ("0.0.1+202610281530"): built into the app and written to
// version.json, so open apps see a new deploy and reload (src/utils/appVersion)
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const APP_VERSION = `${version}+${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`

const versionFile = {
  name: 'app-version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION }) })
  },
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    vue(),
    versionFile,
    VitePWA({
      registerType: 'autoUpdate',
      // icons live in public/img/icons (drawn by a script; replace the PNGs to change the logo,
      // keeping the sizes; the maskable one needs the logo inside the middle 80%)
      includeAssets: [
        'img/icons/favicon-32x32.png',
        'img/icons/apple-touch-icon.png',
        'img/icons/icon-192x192.png',
        'img/icons/icon-512x512.png',
        'img/icons/icon-maskable-512x512.png'
      ],
      // what the phone needs to install the app (home screen icon, name, splash screen)
      manifest: {
        id: '/',
        name: 'Scheduler',
        short_name: 'Scheduler',
        description: 'Coordenador de agendamentos para telemóvel',
        lang: 'pt',
        start_url: '/',
        scope: '/',
        theme_color: '#059669',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/img/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/img/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/img/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Web push: `push` and `notificationclick` handlers live in public/push-sw.js
        importScripts: ['push-sw.js'],
        // This is the key addition. It tells the service worker that
        // any navigation to a URL starting with /auth/ is a valid app route
        // and should be handled by serving the index.html (app shell).
        navigateFallbackAllowlist: [
          /^\/auth\//,
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          // API data is not cached here: the app keeps its own offline copy (src/utils/offlineSync),
          // which is limited to this week and next and wiped on sign-out
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Handled properly inside your docker container network configurations
    port: 5173,
    proxy: {
      // Whenever your PWA fetches something starting with '/api'
      '/api': {
        target: 'https://localhost:9443', // Your Filament Docker app
        changeOrigin: true,
        secure: false, // Allows self-signed SSL certificates on localhost
      },
    },
  },
})