#!/usr/bin/env node
// Сквозная проверка входа и доступа в настоящем браузере (Playwright).
// Нужны: запущенный фронт и Directus с демо-аккаунтами (directus/apply.mjs --seed-demo).
//   E2E_BASE=http://127.0.0.1:5173 DEMO_PASSWORD=... node e2e/auth.e2e.mjs
import { chromium } from 'playwright'

const BASE = (process.env.E2E_BASE ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const API = (process.env.E2E_API ?? 'http://127.0.0.1:8056').replace(/\/$/, '')
const PASS = process.env.DEMO_PASSWORD ?? 'Demo-pass-12345'
const TAB = { student: 'Студент', teacher: 'Препод.', admin: 'Админ', superadmin: 'Админ' }

const results = []
let failed = 0
async function check(name, fn) {
  try {
    await fn()
    results.push(`  ✓ ${name}`)
  } catch (e) {
    failed++
    results.push(`  ✗ ПРОВАЛ ${name}\n      ${String(e.message).split('\n')[0].slice(0, 200)}`)
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })

/** Новая «чистая» сессия браузера + сбор ошибок страницы и неудачных запросов к API */
async function session() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('pl-intro-seen', '1')
    } catch {
      /* ignore */
    }
  })
  const page = await ctx.newPage()
  const log = { pageErrors: [], bad: [] }
  page.on('pageerror', (e) => log.pageErrors.push(e.message))
  page.on('response', (r) => {
    if (r.url().startsWith(API) && r.status() >= 400)
      log.bad.push(`${r.status()} ${r.request().method()} ${r.url().replace(API, '').slice(0, 90)}`)
  })
  return { ctx, page, log }
}
const store = (page, key) => page.evaluate((k) => localStorage.getItem(k), key)
const path = (page) => new URL(page.url()).pathname

async function login(page, role, identity, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: TAB[role], exact: true }).click()
  const inputs = page.locator('form input:not([type=checkbox])')
  await inputs.nth(0).fill(identity)
  await inputs.nth(1).fill(password)
  await page.getByText('Я даю согласие').first().click()
  await page.getByRole('button', { name: /Вход →/ }).click()
}
const loggedIn = (page) => page.waitForURL((u) => u.pathname !== '/login', { timeout: 15000 })

// ───── 1. гость ─────
console.log('\n[гость]')
{
  const { ctx, page } = await session()
  await check('закрытая страница /app отправляет на вход', async () => {
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' })
    assert(path(page) === '/login', `остались на ${path(page)}`)
  })
  await check('/app/admin для гостя тоже ведёт на вход', async () => {
    await page.goto(`${BASE}/app/admin`, { waitUntil: 'networkidle' })
    assert(path(page) === '/login', `остались на ${path(page)}`)
  })
  await check('экран входа показывает список колледжей без авторизации', async () => {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await page.locator('button[aria-haspopup=listbox]').click()
    await page.getByText('БИК').first().waitFor({ timeout: 5000 })
  })
  await ctx.close()
}

// ───── 2. ошибки входа ─────
console.log('\n[ошибки входа]')
{
  const { ctx, page } = await session()
  await check('неверный пароль: понятная ошибка, сессии нет', async () => {
    await login(page, 'student', 'demo-student', 'wrong-password-123')
    await page.getByText('Неверный ID или пароль').waitFor({ timeout: 10000 })
    assert(path(page) === '/login', 'ушли с экрана входа')
    assert((await store(page, 'protocol-directus-auth')) === null, 'токен сохранён после неудачи')
    assert((await store(page, 'protocol-auth')) === null, 'профиль сохранён после неудачи')
  })
  await check(
    'несуществующий пользователь: та же ошибка (без подсказки, есть ли такой логин)',
    async () => {
      await login(page, 'student', 'no-such-user', 'whatever-123456')
      await page.getByText('Неверный ID или пароль').waitFor({ timeout: 10000 })
    },
  )
  await check('вход без согласия на обработку данных невозможен', async () => {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    const inputs = page.locator('form input:not([type=checkbox])')
    await inputs.nth(0).fill('demo-student')
    await inputs.nth(1).fill(PASS)
    assert(
      await page.getByRole('button', { name: /Вход →/ }).isDisabled(),
      'кнопка активна без согласия',
    )
  })
  await check('вкладка не той роли: вход отклонён и сессия сброшена', async () => {
    await login(page, 'teacher', 'demo-student', PASS)
    await page.getByText(/Этот аккаунт/).waitFor({ timeout: 10000 })
    assert(path(page) === '/login', 'пустили в портал под чужой вкладкой')
    await page.waitForTimeout(500)
    assert((await store(page, 'protocol-auth')) === null, 'профиль остался в хранилище')
  })
  await ctx.close()
}

// ───── 3. жизненный цикл сессии студента ─────
console.log('\n[сессия студента]')
{
  const { ctx, page, log } = await session()
  await check('вход студента по номеру', async () => {
    await login(page, 'student', 'demo-student', PASS)
    await loggedIn(page)
    const u = JSON.parse((await store(page, 'protocol-auth')) ?? 'null')
    assert(u?.role === 'student', `роль в профиле: ${u?.role}`)
    assert(u?.institutionShort === 'БИК', `колледж: ${u?.institutionShort}`)
    const t = JSON.parse((await store(page, 'protocol-directus-auth')) ?? 'null')
    assert(t?.access_token, 'токен не сохранён в нормальном виде')
  })
  await check('сессия переживает перезагрузку страницы', async () => {
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' })
    assert(path(page) === '/app', `после перезагрузки: ${path(page)}`)
    await page.reload({ waitUntil: 'networkidle' })
    assert(path(page) === '/app', `после второй перезагрузки: ${path(page)}`)
  })
  await check('студент не попадает в админку и кабинет преподавателя', async () => {
    for (const p of ['/app/admin', '/app/teach', '/app/journal']) {
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' })
      assert(!path(page).startsWith(p), `студент открыл ${p}`)
    }
  })
  await check('выход: возврат на вход, хранилище очищено, /app снова закрыт', async () => {
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Выйти' }).first().click()
    await page.waitForURL((u) => u.pathname === '/login', { timeout: 10000 })
    assert((await store(page, 'protocol-auth')) === null, 'профиль остался')
    assert((await store(page, 'protocol-directus-auth')) === null, 'токен остался')
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' })
    assert(path(page) === '/login', 'после выхода /app открылся')
  })
  await ctx.close()
  void log
}

// ───── 4. недействительная сессия ─────
console.log('\n[недействительная сессия]')
{
  const { ctx, page } = await session()
  await check('подделанный/просроченный токен не оставляет «зомби-вход»', async () => {
    await login(page, 'student', 'demo-student', PASS)
    await loggedIn(page)
    await page.evaluate(() => {
      const t = JSON.parse(localStorage.getItem('protocol-directus-auth'))
      t.access_token = 'invalid.token.value'
      t.refresh_token = 'invalid-refresh'
      t.expires_at = 1
      localStorage.setItem('protocol-directus-auth', JSON.stringify(t))
    })
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' })
    await page.waitForURL((u) => u.pathname === '/login', { timeout: 10000 })
    assert((await store(page, 'protocol-auth')) === null, 'кэш профиля не сброшен')
  })
  await ctx.close()
}

// ───── 5. по ролям: вход и обзор страниц ─────
const PAGES = {
  student: [
    '/portal',
    '/app',
    '/app/courses',
    '/app/profile',
    '/app/board',
    '/app/quizzes',
    '/app/leaderboard',
  ],
  teacher: [
    '/portal',
    '/app',
    '/app/courses',
    '/app/profile',
    '/app/board',
    '/app/quizzes',
    '/app/teach',
    '/app/journal',
  ],
  admin: ['/portal', '/app', '/app/courses', '/app/profile', '/app/admin'],
  superadmin: ['/portal', '/app', '/app/courses', '/app/profile', '/app/admin'],
}
for (const role of ['student', 'teacher', 'admin', 'superadmin']) {
  console.log(`\n[роль: ${role}]`)
  const { ctx, page, log } = await session()
  await check(`вход (${role})`, async () => {
    await login(page, role, `demo-${role}`, PASS)
    await loggedIn(page)
    const u = JSON.parse((await store(page, 'protocol-auth')) ?? 'null')
    assert(u?.role === role, `роль в профиле: ${u?.role}`)
  })
  for (const p of PAGES[role]) {
    await check(`страница ${p} открывается без ошибок`, async () => {
      const before = { e: log.pageErrors.length, b: log.bad.length }
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' })
      assert(path(page) === p, `редирект на ${path(page)}`)
      await page.waitForTimeout(400)
      const crashed = await page.getByText(/что-то пошло не так|something went wrong/i).count()
      assert(!crashed, 'показан экран ошибки приложения')
      assert(
        log.pageErrors.length === before.e,
        `ошибки JS: ${log.pageErrors.slice(before.e).join(' | ')}`,
      )
      assert(
        log.bad.length === before.b,
        `запросы к API отклонены: ${log.bad.slice(before.b).join(' | ')}`,
      )
    })
  }
  await ctx.close()
}

await browser.close()
console.log(results.join('\n'))
console.log(
  `\nИтого: ${results.filter((r) => r.startsWith('  ✓')).length} из ${results.length} проверок прошли${failed ? ` — ПРОВАЛОВ: ${failed}` : ''}`,
)
process.exit(failed ? 1 : 0)
