import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The backend (Projects/kipekee-creations-backend) has no CORS config on
    // purpose; the dev server proxies /api to it instead, matching webchama-2.0.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
