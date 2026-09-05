import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/zones': 'http://localhost:8000',
      '/reports': 'http://localhost:8000',
      '/alerts': 'http://localhost:8000',
      '/stats': 'http://localhost:8000',
      '/risk': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/notifications': 'http://localhost:8000',
    },
  },
})
