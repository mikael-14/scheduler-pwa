import { defineConfig } from "vite";
import { VitePWA } from "@vite-pwa/plugin";
 
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tui Calendar PWA",
        short_name: "TuiCalendar",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#317EFB",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/uicdn\.toast\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tui-calendar-cdn",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ]
});