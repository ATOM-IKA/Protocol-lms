import '@/shared/lib/noApiCache'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Шрифты (самохостинг через @fontsource, без сторонних CDN)
import '@fontsource-variable/inter'
import '@fontsource-variable/unbounded'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import { App } from './app/App'
import './styles/index.css'

// Автовосстановление при устаревшем кэше: если после деплоя старый index.html
// ссылается на удалённый JS-чанк — вместо ошибки один раз перезагружаем страницу
// (получаем свежий index и актуальные файлы).
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('protocol-reloaded')) {
    sessionStorage.setItem('protocol-reloaded', '1')
    window.location.reload()
  }
})
// после успешной загрузки снимаем флаг, чтобы восстановление работало и в будущем
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem('protocol-reloaded'), 4000)
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
