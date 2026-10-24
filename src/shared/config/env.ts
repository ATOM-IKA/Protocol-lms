// Адреса бэкендов.
// PocketBase (старый): в проде фронт и PB были на одном домене → берём origin.
// Directus (новый): ВСЕГДА явный URL (отдельный поддомен). CORS обеспечивает nginx.
const pbUrl = import.meta.env.VITE_POCKETBASE_URL?.trim()
const dxUrl = import.meta.env.VITE_DIRECTUS_URL?.trim()
const pbOrigin =
  import.meta.env.PROD && typeof window !== 'undefined' ? window.location.origin : ''

export const env = {
  /** Старый бэкенд (PocketBase) — живёт до удаления PB-слоя. */
  pocketbaseUrl: pbOrigin || pbUrl || 'http://127.0.0.1:8090',
  /** Новый бэкенд (Directus) — явный URL, всегда (без origin!). */
  directusUrl:
    dxUrl ||
    // Забыли VITE_DIRECTUS_URL при боевой сборке: localhost у посетителя — это его компьютер, вход бы молча не работал.
    // Берём API на поддомене текущего сайта (protocol-lms.ru → https://api.protocol-lms.ru).
    (import.meta.env.PROD && typeof window !== 'undefined'
      ? `https://api.${window.location.hostname.replace(/^www\./, '')}`
      : 'http://127.0.0.1:8055'),
  /** DEV-токен авторизации (шаг 1). В PROD-сборке НЕ задавать. */
  directusStaticToken: import.meta.env.VITE_DIRECTUS_STATIC_TOKEN?.trim() || '',
} as const

/**
 * true → dev-авторизация: статик-токен + вход без проверки пароля (резолв по email/student_id).
 * Включается только явным VITE_DEV_AUTH_BYPASS=true и только вне PROD-сборки.
 * В PROD статик-токен игнорируется, чтобы случайно не оставить вход без пароля.
 */
export const isDevAuth =
  import.meta.env.VITE_DEV_AUTH_BYPASS === 'true' && !!env.directusStaticToken && !import.meta.env.PROD

// Предупреждение, если в прод-сборку всё же попал статик-токен
if (import.meta.env.PROD && env.directusStaticToken) {
  console.error(
    '[PROTOCOL] VITE_DIRECTUS_STATIC_TOKEN задан в PROD-сборке — это небезопасно. Удалите его из .env и пересоберите.',
  )
}