#!/usr/bin/env node
// Адаптивность: обходит страницы в разных размерах экрана и ищет типичные дефекты вёрстки —
// горизонтальную прокрутку, элементы за краем экрана, мелкие кнопки на телефоне, ошибки в консоли.
//   E2E_BASE=http://127.0.0.1:5173 E2E_SHOTS=/путь/для/скриншотов node e2e/responsive.e2e.mjs
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { demoLogin, demoPassword } from '../directus/model.mjs'
import { loadSecrets } from '../directus/lib.mjs'

loadSecrets(process.env.E2E_ENV ?? '.env.audit')
const BASE = (process.env.E2E_BASE ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const SHOTS = process.env.E2E_SHOTS
if (SHOTS) mkdirSync(SHOTS, { recursive: true })
const TAB = { student: 'Студент', teacher: 'Препод.', admin: 'Админ', superadmin: 'Админ' }

const VIEWPORTS = [
  { name: 'phone-s', width: 360, height: 740, touch: true },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'tablet', width: 768, height: 1024, touch: true },
  { name: 'laptop', width: 1024, height: 768, touch: false },
  { name: 'desktop', width: 1440, height: 900, touch: false },
]
const PUBLIC = ['/', '/login', '/privacy', '/features']
const BY_ROLE = {
  student: [
    '/portal',
    '/app',
    '/app/courses',
    '/app/profile',
    '/app/board',
    '/app/quizzes',
    '/app/leaderboard',
  ],
  teacher: ['/app/teach', '/app/journal'],
  admin: ['/app/admin'],
}

/** Что проверяем внутри страницы */
function audit(touch) {
  const vw = window.innerWidth
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p)
      if (/(hidden|clip|auto|scroll)/.test(o.overflowX)) return true
    }
    return false
  }
  const label = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? '#' + el.id : '') +
    (typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '')
  const out = { docOverflow: document.documentElement.scrollWidth - vw, offenders: [], small: [] }
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue
    const inlineText = cs.display === 'inline' // ссылка внутри предложения: стандарт доступности (WCAG 2.5.8) допускает малый размер
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.right > vw + 1 && !clipped(el) && out.offenders.length < 6) {
      out.offenders.push(
        `${label(el)} → правый край ${Math.round(r.right)}px при ширине экрана ${vw}px`,
      )
    }
    if (
      touch &&
      !inlineText &&
      /^(A|BUTTON)$/.test(el.tagName) &&
      (r.width < 28 || r.height < 28) &&
      r.bottom > 0 &&
      r.top < innerHeight &&
      out.small.length < 4
    ) {
      out.small.push(`${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}px`)
    }
  }
  return out
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const issues = []
let pagesChecked = 0

async function sweep(role, paths) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.touch,
      isMobile: vp.touch,
      deviceScaleFactor: 1,
    })
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem('pl-intro-seen', '1')
      } catch {
        /* ignore */
      }
    })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    if (role) {
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: TAB[role], exact: true }).click()
      const inputs = page.locator('form input:not([type=checkbox])')
      await inputs.nth(0).fill(demoLogin(role))
      await inputs.nth(1).fill(demoPassword())
      await page.getByText('Я даю согласие').first().click()
      await page.getByRole('button', { name: /Вход →/ }).click()
      await page.waitForURL((u) => u.pathname !== '/login', { timeout: 15000 })
    }
    for (const p of paths) {
      errors.length = 0
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(700)
      const res = await page.evaluate(audit, vp.touch)
      pagesChecked++
      const where = `${role ?? 'гость'} ${p} @${vp.name}(${vp.width})`
      if (res.docOverflow > 1)
        issues.push(
          `${where}: страница шире экрана на ${res.docOverflow}px (горизонтальная прокрутка)`,
        )
      for (const o of res.offenders) issues.push(`${where}: ${o}`)
      if (res.small.length)
        issues.push(`${where}: мелкие элементы управления: ${res.small.join('; ')}`)
      if (errors.length) issues.push(`${where}: ошибка JS: ${errors[0].slice(0, 120)}`)
      if (SHOTS)
        await page.screenshot({
          path: `${SHOTS}/${role ?? 'guest'}${p.replace(/\//g, '_') || '_root'}__${vp.name}.png`,
        })
    }
    await ctx.close()
  }
}

await sweep(null, PUBLIC)
for (const role of ['student', 'teacher', 'admin']) await sweep(role, BY_ROLE[role])
await browser.close()

// сворачиваем одинаковые замечания, чтобы отчёт читался
const grouped = new Map()
for (const i of issues) {
  const text = i.replace(/^\S+ \S+ @\S+ /, '')
  const key = text.replace(/\d+px/g, 'Npx')
  const page = i.match(/^(\S+ \S+) @(\S+)/)
  const g = grouped.get(key) ?? { text, where: new Set() }
  g.where.add(`${page?.[1]}@${page?.[2]}`)
  grouped.set(key, g)
}
console.log(`\nПроверено страниц × размеров экрана: ${pagesChecked}`)
if (!issues.length) console.log('✓ дефектов вёрстки не найдено')
else {
  console.log(`✗ замечаний: ${issues.length} (уникальных: ${grouped.size})\n`)
  for (const g of grouped.values()) {
    console.log(
      `  • ${g.text}\n      ${[...g.where].slice(0, 6).join(', ')}${g.where.size > 6 ? ` … (+${g.where.size - 6})` : ''}`,
    )
  }
}
process.exit(issues.length ? 1 : 0)
