import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// Base URL for GitHub Pages deployment (or '/' for local development)
const base = process.env.VITE_BASE_URL || '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'Ghost Note',
        short_name: 'Ghost Note',
        description: 'Transform poems into songs with Ghost Note',
        theme_color: '#1e1b4b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache strategies for different asset types
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Allow larger bundles to be cached (default is 2MB)
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cache CMU dictionary and large data files
            urlPattern: /\.(?:json|txt)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ghost-note-data-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache fonts
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ghost-note-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ghost-note-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    // Bundle analyzer - generates stats.html after build (only when ANALYZE=true)
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),
  // Set base path for GitHub Pages deployment
  // VITE_BASE_URL is set during CI/CD, defaults to '/' for local development
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '5173', 10),
  },
  build: {
    // Enable source maps for debugging
    sourcemap: false,
    // Optimize chunk splitting for better caching and smaller initial load
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal code-splitting
        manualChunks: {
          // React core - small and cached for a long time
          'vendor-react': ['react', 'react-dom'],
          // State management
          'vendor-zustand': ['zustand'],
          // Heavy music notation library - lazy loaded
          'vendor-abcjs': ['abcjs'],
          // Phonetics/pronunciation - very heavy, lazy loaded
          'vendor-cmu-dict': ['cmu-pronouncing-dictionary'],
          // Sentiment analysis
          'vendor-sentiment': ['sentiment'],
          // Diff utilities
          'vendor-diff': ['diff-match-patch'],
        },
      },
    },
    // Warn for chunks larger than 300KB
    chunkSizeWarningLimit: 300,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'e2e/**'],
  },
})
