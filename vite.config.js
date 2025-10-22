import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react({
      // Include .jsx, .js, and .mjs files
      include: ['**/*.jsx', '**/*.js', '**/*.mjs'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['church-logo.png'],
      manifest: {
        name: 'Greater Works Attendance Tracker',
        short_name: 'GW Attendance',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#D4AF37',
        icons: [
          {
            src: '/church-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/church-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp}']
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  // Add this to handle .js files as ES modules
  esbuild: {
    loader: 'jsx',
    include: /.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  }
})
