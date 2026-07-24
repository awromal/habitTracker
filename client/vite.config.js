import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to the Express server so the auth cookie is same-origin in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
