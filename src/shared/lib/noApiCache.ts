import { env } from '@/shared/config/env'

const API = env.directusUrl.replace(/\/+$/, '')
const orig = window.fetch.bind(window)

window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input)

    if (url.startsWith(API)) {
      const method =
        (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()

      if (method === 'GET') {
        return orig(input, {
          ...init,
          cache: 'no-store',
        })
      }
    }
  } catch {
    // Не ломаем запрос, если что-то в обёртке не удалось
  }

  return orig(input as any, init as any)
}) as typeof window.fetch