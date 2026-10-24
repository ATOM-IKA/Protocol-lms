// Общие утилиты для скриптов Directus: окружение, HTTP-клиент, режим «только показать» (dry-run).
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function loadEnv(file) {
  const path = resolve(process.cwd(), file)
  if (!existsSync(path)) return {}
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}

/**
 * Клиент Directus. Токен берётся из DIRECTUS_STATIC_TOKEN либо логином (DIRECTUS_ADMIN_EMAIL/PASSWORD —
 * для локальной песочницы). В dry-run любая запись только печатается, на сервер не уходит.
 */
export async function connect({ envFile = '.env.audit', dryRun = true } = {}) {
  const env = { ...loadEnv(envFile), ...process.env }
  const url = (env.DIRECTUS_URL || '').replace(/\/$/, '')
  if (!url) throw new Error(`Нет DIRECTUS_URL (файл ${envFile})`)
  let token = env.DIRECTUS_STATIC_TOKEN
  if (!token && env.DIRECTUS_ADMIN_EMAIL) {
    const r = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: env.DIRECTUS_ADMIN_EMAIL,
        password: env.DIRECTUS_ADMIN_PASSWORD,
      }),
    })
    token = (await r.json())?.data?.access_token
  }
  if (!token)
    throw new Error('Нет токена: задайте DIRECTUS_STATIC_TOKEN или DIRECTUS_ADMIN_EMAIL/PASSWORD')

  const stats = { planned: 0, done: 0 }
  async function raw(method, path, body, auth = token) {
    const r = await fetch(url + path, {
      method,
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await r.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      /* не JSON */
    }
    if (!r.ok) {
      const msg = json?.errors?.map((e) => e.message).join('; ') || text.slice(0, 200)
      const err = new Error(`${method} ${path} → ${r.status}: ${msg}`)
      err.status = r.status
      throw err
    }
    return json?.data ?? null
  }
  return {
    url,
    dryRun,
    stats,
    get: (path) => raw('GET', path),
    /** запись: в dry-run только считаем и печатаем */
    async write(method, path, body, note = '') {
      stats.planned++
      if (dryRun) {
        console.log(`  [dry-run] ${method} ${path}${note ? '  — ' + note : ''}`)
        return null
      }
      const out = await raw(method, path, body)
      stats.done++
      return out
    },
    /** вход произвольным пользователем — для проверки прав */
    async loginAs(email, password) {
      const r = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(`login ${email}: ${j?.errors?.[0]?.message}`)
      return j.data.access_token
    },
    as: (userToken) => ({
      req: (method, path, body) => raw(method, path, body, userToken),
    }),
  }
}

export const log = {
  step: (s) => console.log(`\n▶ ${s}`),
  ok: (s) => console.log(`  ✓ ${s}`),
  skip: (s) => console.log(`  · ${s}`),
  warn: (s) => console.log(`  ! ${s}`),
}
