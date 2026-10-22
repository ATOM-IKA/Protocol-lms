import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Жёсткий IPv4-бинд: Vite слушает 127.0.0.1 напрямую, без резолва имени
    // localhost. Убирает лотерею IPv4/IPv6 в Windows + Node 24, из-за которой
    // браузер ловил ERR_CONNECTION_REFUSED то на localhost, то на 127.0.0.1.
    // Открывать всегда: http://127.0.0.1:5173/  (не localhost).
    host: '127.0.0.1',
    port: 5173,
  },
})