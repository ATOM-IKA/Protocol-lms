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
  // карты исходников в боевую сборку не кладём: исходный код и комментарии не должны уходить посетителям
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Библиотеки — отдельными файлами: браузер кеширует их между обновлениями сайта и грузит параллельно
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react'
          if (/node_modules\/(framer-motion|motion-dom|motion-utils|lenis)\//.test(id)) return 'vendor-motion'
          if (/node_modules\/@directus\//.test(id)) return 'vendor-directus'
          if (/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(id)) return 'vendor-i18n'
          if (/node_modules\/@tanstack\//.test(id)) return 'vendor-query'
          return undefined
        },
      },
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