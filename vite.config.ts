import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/adventure/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev-time proxy so the V1 API path works against the live homelab
      // during local development. Override with VITE_API_TARGET env if needed.
      '/adventure/api': {
        target: process.env.VITE_API_TARGET || 'https://games.khe.ee',
        changeOrigin: true,
        secure: true,
      },
    },
  },
}))
