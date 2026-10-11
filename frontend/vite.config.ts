import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'TouchGrass AI',
        short_name: 'TouchGrass',
        description: 'Small outdoor missions, powered by open AI.',
        theme_color: '#183f32',
        background_color: '#f7f6ef',
        display: 'standalone',
        start_url: '/',
        icons: []
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}'] }
    })
  ],
  server: { host: '127.0.0.1', port: 5173 }
})