import { useEffect } from 'react'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

/**
 * Единый обработчик ошибок маршрутизации. Главная задача — устойчивость к
 * устаревшему кэшу: если сборка обновилась, а браузер держит старый index.html,
 * динамический импорт чанка падает или маршрут не находится. В этом случае один
 * раз перезагружаем страницу (получаем свежую версию), иначе показываем экран
 * с кнопками.
 */
export function RouteError() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404
  const msg = (error as Error)?.message || ''
  const looksStale =
    is404 ||
    /dynamically imported module|Failed to fetch|Importing a module|ChunkLoadError|error loading/i.test(msg)

  useEffect(() => {
    if (looksStale && !sessionStorage.getItem('protocol-reloaded')) {
      sessionStorage.setItem('protocol-reloaded', '1')
      window.location.reload()
    }
  }, [looksStale])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg px-6 text-center">
      <div className="font-display text-5xl font-bold text-aqua">PROTOCOL</div>
      <p className="max-w-md text-ink-soft">
        Страница обновляется до новой версии. Если не открылась автоматически — нажмите кнопку ниже.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => { sessionStorage.removeItem('protocol-reloaded'); window.location.reload() }}
          className="clip-btn bg-lime px-5 py-2.5 font-display font-bold text-bg transition-colors hover:bg-lime-bright"
        >
          Обновить
        </button>
        <a
          href="/portal"
          className="clip-btn border border-line-strong px-5 py-2.5 font-mono text-sm text-ink-muted transition-colors hover:border-aqua hover:text-aqua"
        >
          На портал
        </a>
      </div>
    </div>
  )
}
