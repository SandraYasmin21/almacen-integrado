import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5176,
    strictPort: true,
    proxy: {
      // Redirige /api/* y /sanctum/* al backend Laravel
      '/api': {
        target: 'http://127.0.0.1:8004',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://127.0.0.1:8004',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
