import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MindFlow - AI Journaling',
        short_name: 'MindFlow',
        description: 'AI-powered journaling app that asks questions and provides insights',
        theme_color: '#6366f1', // MindFlow Purple
        background_color: '#6366f1', // MindFlow Purple
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Start Journaling',
            short_name: 'Journal',
            description: 'Begin a new journaling session',
            url: '/journal',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Mood Check-in',
            short_name: 'Mood',
            description: 'Quickly log your current mood',
            url: '/mood-tracker',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'View Insights',
            short_name: 'Insights',
            description: 'Check your personal growth insights',
            url: '/insights',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Add a custom service worker file to handle push events
        swDest: 'dist/sw.js',
        additionalManifestEntries: [
          { url: '/index.html', revision: '0.fea8j4hdq18' }, // Ensure index.html is precached
        ],
      },
      devOptions: {
        enabled: true,
      },
      // Custom service worker code for push notifications
      injectManifest: {
        injectionPoint: undefined, // No specific injection point needed for this custom SW
        // This will be the custom service worker file
        // The `swSrc` file will be copied to `swDest` and Workbox will inject its precache manifest into it.
        // We'll create a simple `sw.ts` file for this.
        swSrc: 'src/sw.ts', 
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));