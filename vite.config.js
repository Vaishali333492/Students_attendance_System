import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: '', // Keep asset files at root of dist/ for flat routing
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      '/accounts': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/teacher': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/student': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/attendance': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },
})
