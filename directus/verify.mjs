#!/usr/bin/env node
// Проверка прав: под каждой ролью пытаемся сделать и разрешённое, и запрещённое.
// Требует демо-пользователей (apply.mjs --seed-demo). Создаёт и удаляет собственные тестовые записи.
//   node directus/verify.mjs --env FILE
import { connect } from './lib.mjs'
import { LOGIN_DOMAIN } from './model.mjs'

const args = process.argv.slice(2)
const envFile = args.includes('--env') ? args[args.indexOf('--env') + 1] : '.env.audit'
const PASS = process.env.DEMO_PASSWORD || 'Demo-pass-12345'

let failed = 0,
  total = 0
const results = []
async function check(name, expectation, fn) {
  total++
  let outcome,
    detail = ''
  try {
    const r = await fn()
    outcome = 'allowed'
    detail = typeof r === 'string' ? r : ''
    if (r === 'EMPTY') outcome = 'denied'
  } catch (e) {
    outcome = e.status === 403 || e.status === 400 || e.status === 401 ? 'denied' : 'error'
    detail = e.message.slice(0, 140)
  }
  const ok = outcome === expectation
  if (!ok) failed++
  results.push(
    `${ok ? '  ✓' : '  ✗ ПРОВАЛ'} ${name} — ожидалось ${expectation === 'allowed' ? 'разрешено' : 'запрещено'}, получено ${outcome === 'allowed' ? 'разрешено' : outcome === 'denied' ? 'запрещено' : 'ОШИБКА'}${ok ? '' : ' | ' + detail}`,
  )
}
const empty = (rows) =>
  !rows || (Array.isArray(rows) && rows.length === 0) ? 'EMPTY' : 'rows:' + rows.length

const dx = await connect({ envFile, dryRun: false })
const roles = Object.fromEntries(
  (await dx.get('/roles?limit=-1&fields=id,name')).map((r) => [r.name, r.id]),
)
const login = async (k) => dx.as(await dx.loginAs(`demo-${k}@${LOGIN_DOMAIN}`, PASS))
const S = await login('student'),
  T = await login('teacher'),
  A = await login('admin'),
  SA = await login('superadmin')
const NO = dx.as(null)
const me = async (c) => await c.req('GET', '/users/me?fields=id,institution,role.name')

// ───── подготовка данных (под техническим админом) ─────
const inst1 = (await dx.get('/items/institutions?filter[short_name][_eq]=БИК'))[0].id
let inst2 = (await dx.get('/items/institutions?filter[short_name][_eq]=ТЕСТ2'))[0]?.id
if (!inst2)
  inst2 = (
    await dx.write('POST', '/items/institutions', {
      name: 'Тестовый колледж 2',
      short_name: 'ТЕСТ2',
    })
  ).id
const idOf = async (k) => (await me(await login(k))).id
const [sid, tid, aid, said] = [
  await idOf('student'),
  await idOf('teacher'),
  await idOf('admin'),
  await idOf('superadmin'),
]
const mkUser = async (email, role, institution, extra = {}) => {
  const ex = await dx.get(`/users?filter[email][_eq]=${email}&fields=id`)
  if (ex.length) return ex[0].id
  return (
    await dx.write('POST', '/users', {
      email,
      password: PASS,
      role: roles[role],
      status: 'active',
      full_name: email,
      institution,
      student_id: email,
      ...extra,
    })
  ).id
}
const teacher2 = await mkUser('teacher2@demo.example.com', 'teacher', inst1)
const studentB = await mkUser('studentb@demo.example.com', 'student', inst2)
const teacherB = await mkUser('teacherb@demo.example.com', 'teacher', inst2)
const mkItem = async (c, body, key) => {
  const ex = await dx.get(`/items/${c}?filter[${key[0]}][_eq]=${key[1]}&limit=1`)
  return ex[0]?.id ?? (await dx.write('POST', `/items/${c}`, body)).id
}
const cPub = await mkItem(
  'courses',
  { title: 'ТЕСТ-публичный', owner: tid, institution: inst1, status: 'published' },
  ['title', 'ТЕСТ-публичный'],
)
const cDraft = await mkItem(
  'courses',
  { title: 'ТЕСТ-черновик', owner: tid, institution: inst1, status: 'draft' },
  ['title', 'ТЕСТ-черновик'],
)
const cOther = await mkItem(
  'courses',
  { title: 'ТЕСТ-чужой-колледж', owner: tid, institution: inst2, status: 'published' },
  ['title', 'ТЕСТ-чужой-колледж'],
)
await dx.write('PATCH', `/items/courses/${cOther}`, { owner: teacherB }) // курс чужого колледжа принадлежит ЕГО преподавателю
const cT2 = await mkItem(
  'courses',
  { title: 'ТЕСТ-второго-препода', owner: teacher2, institution: inst1, status: 'published' },
  ['title', 'ТЕСТ-второго-препода'],
)
const secId = await mkItem('sections', { course: cPub, title: 'ТЕСТ-раздел' }, [
  'title',
  'ТЕСТ-раздел',
])
const lesId = await mkItem('lessons', { course: cPub, section: secId, title: 'ТЕСТ-урок' }, [
  'title',
  'ТЕСТ-урок',
])
const quizId = await mkItem(
  'quizzes',
  { course: cPub, author: tid, institution: inst1, title: 'ТЕСТ-квиз', published: true },
  ['title', 'ТЕСТ-квиз'],
)
await mkItem(
  'quiz_questions',
  { quiz: quizId, text: 'ТЕСТ-вопрос', correct: ['a'], options: ['a', 'b'] },
  ['text', 'ТЕСТ-вопрос'],
)
const subId = await mkItem(
  'submissions',
  { student: sid, course: cPub, lesson: lesId, text: 'ТЕСТ-работа' },
  ['text', 'ТЕСТ-работа'],
)

// ───── вход и профиль ─────
console.log('\n[вход и профиль]')
for (const [k, c] of [
  ['student', S],
  ['teacher', T],
  ['admin', A],
  ['superadmin', SA],
]) {
  await check(`${k}: /users/me показывает роль и колледж`, 'allowed', async () => {
    const m = await me(c)
    if (m.role?.name !== k || !m.institution)
      throw Object.assign(new Error(`роль=${m.role?.name} колледж=${m.institution}`), {
        status: 500,
      })
  })
}

// ───── без входа ─────
console.log('\n[аноним]')
await check('аноним читает список колледжей', 'allowed', () =>
  NO.req('GET', '/items/institutions?fields=id,name,short_name'),
)
await check('аноним читает курсы', 'denied', async () =>
  empty(await NO.req('GET', '/items/courses')),
)
await check('аноним читает пользователей', 'denied', async () =>
  empty(await NO.req('GET', '/users')),
)

// ───── студент ─────
console.log('\n[студент]')
await check('меняет себе xp', 'denied', () => S.req('PATCH', `/users/${sid}`, { xp: 99999 }))
await check('меняет себе coins', 'denied', () => S.req('PATCH', `/users/${sid}`, { coins: 99999 }))
await check('меняет себе роль на admin', 'denied', () =>
  S.req('PATCH', `/users/${sid}`, { role: roles.admin }),
)
await check('меняет себе колледж', 'denied', () =>
  S.req('PATCH', `/users/${sid}`, { institution: inst2 }),
)
await check('меняет свой позывной', 'allowed', () =>
  S.req('PATCH', `/users/${sid}`, { callsign: 'neo' }),
)
await check('меняет чужой профиль', 'denied', async () =>
  empty(
    await S.req('PATCH', `/users/${tid}`, { callsign: 'x' }).catch((e) => {
      if (e.status === 403) throw e
      return []
    }),
  ),
)
await check('видит опубликованный курс своего колледжа', 'allowed', async () =>
  (await S.req('GET', `/items/courses/${cPub}`)).id ? 'ok' : '',
)
await check('видит черновик', 'denied', () => S.req('GET', `/items/courses/${cDraft}`))
await check('видит курс чужого колледжа', 'denied', () => S.req('GET', `/items/courses/${cOther}`))
await check('в списке курсов нет чужих/черновиков', 'allowed', async () => {
  const t = (await S.req('GET', '/items/courses?fields=title')).map((c) => c.title)
  if (t.includes('ТЕСТ-черновик') || t.includes('ТЕСТ-чужой-колледж'))
    throw Object.assign(new Error('утечка: ' + t.join(',')), { status: 500 })
})
await check('создаёт курс', 'denied', () =>
  S.req('POST', '/items/courses', { title: 'x', owner: sid, institution: inst1 }),
)
await check('читает правильные ответы теста (correct)', 'denied', async () => {
  const rows = await S.req('GET', '/items/quiz_questions?fields=id,correct')
  return empty(rows)
})
await check('читает вопросы теста без correct', 'allowed', async () =>
  empty(await S.req('GET', '/items/quiz_questions?fields=id,text')) === 'EMPTY'
    ? Promise.reject(Object.assign(new Error('пусто'), { status: 500 }))
    : 'ok',
)
// чистим следы прошлого запуска, чтобы проверка была повторяемой
for (const e of await dx.get(
  `/items/enrollments?filter[course][_eq]=${cPub}&filter[student][_eq]=${sid}&fields=id`,
))
  await dx.write('DELETE', `/items/enrollments/${e.id}`)
await check('записывается на курс (владелец ставится сервером)', 'allowed', async () => {
  await S.req('POST', '/items/enrollments', { course: cPub })
  const e = await dx.get(
    `/items/enrollments?filter[course][_eq]=${cPub}&filter[student][_eq]=${sid}&fields=id`,
  )
  if (!e.length) throw Object.assign(new Error('запись не создана для студента'), { status: 500 })
})
await check('повторная запись на тот же курс (уникальный ключ)', 'denied', () =>
  S.req('POST', '/items/enrollments', { course: cPub }),
)
await check('записывает ДРУГОГО студента на курс', 'denied', async () => {
  await S.req('POST', '/items/enrollments', { course: cT2, student: tid })
})
await check('пишет себе progress_percent', 'denied', async () => {
  const e = await S.req('GET', `/items/enrollments?filter[student][_eq]=${sid}&limit=1`)
  await S.req('PATCH', `/items/enrollments/${e[0].id}`, { progress_percent: 100 })
})
await check('сдаёт работу с готовой оценкой', 'denied', () =>
  S.req('POST', '/items/submissions', { course: cPub, lesson: lesId, student: sid, grade: 5 }),
)
await check('ставит себе оценку в своей сдаче', 'denied', () =>
  S.req('PATCH', `/items/submissions/${subId}`, { grade: 5 }),
)
await check('сдаёт работу от чужого имени', 'denied', () =>
  S.req('POST', '/items/submissions', { course: cPub, lesson: lesId, student: tid, text: 'x' }),
)
await check('создаёт себе уведомление', 'denied', () =>
  S.req('POST', '/items/notifications', { user: sid, title: 'x' }),
)
await check('пишет в рейтинг', 'denied', () =>
  S.req('POST', '/items/leaderboard', { user: sid, xp: 999 }),
)
await check('пишет в журнал аудита', 'denied', () =>
  S.req('POST', '/items/audit_logs', { action: 'x' }),
)
await check('создаёт пользователя', 'denied', () =>
  S.req('POST', '/users', { email: 'hack@demo.example.com', password: PASS, role: roles.student }),
)

// ───── преподаватель ─────
console.log('\n[преподаватель]')
await check('создаёт курс (владелец проставляется)', 'allowed', async () => {
  const r = await T.req('POST', '/items/courses', { title: 'ТЕСТ-курс-препода' })
  const c = await dx.get(`/items/courses/${r.id}?fields=owner,institution`)
  if (c.owner !== tid || c.institution !== inst1)
    throw Object.assign(new Error(`owner=${c.owner} inst=${c.institution}`), { status: 500 })
})
await check('создаёт курс от имени другого владельца', 'denied', async () => {
  const r = await T.req('POST', '/items/courses', {
    title: 'ТЕСТ-подмена-владельца',
    owner: teacher2,
  })
  const c = await dx.get(`/items/courses/${r.id}?fields=owner`)
  if (c.owner !== tid)
    throw Object.assign(new Error('владелец подменён на ' + c.owner), { status: 403 })
})
await check('правит свой курс', 'allowed', () =>
  T.req('PATCH', `/items/courses/${cPub}`, { subtitle: 'ok' }),
)
await check('правит курс другого преподавателя', 'denied', () =>
  T.req('PATCH', `/items/courses/${cT2}`, { subtitle: 'hack' }),
)
await check('видит курс чужого колледжа', 'denied', () => T.req('GET', `/items/courses/${cOther}`))
await check('ставит оценку за сдачу в своём курсе', 'allowed', () =>
  T.req('PATCH', `/items/submissions/${subId}`, { grade: 5, feedback: 'ok' }),
)
await check('ставит оценку в чужом курсе', 'denied', async () => {
  const sid2 = await mkItem(
    'submissions',
    { student: sid, course: cT2, lesson: lesId, text: 'ТЕСТ-в-чужом-курсе' },
    ['text', 'ТЕСТ-в-чужом-курсе'],
  )
  await T.req('PATCH', `/items/submissions/${sid2}`, { grade: 5 })
})
await check('пишет студенту xp', 'denied', () => T.req('PATCH', `/users/${sid}`, { xp: 5000 }))
await check('меняет студенту роль', 'denied', () =>
  T.req('PATCH', `/users/${sid}`, { role: roles.teacher }),
)
await check('видит студента своего колледжа', 'allowed', async () =>
  (await T.req('GET', `/users/${sid}?fields=id,student_id`)).id ? 'ok' : '',
)
await check('видит студента чужого колледжа', 'denied', () =>
  T.req('GET', `/users/${studentB}?fields=id`),
)
await check('читает правильные ответы своего теста', 'allowed', async () =>
  empty(await T.req('GET', '/items/quiz_questions?fields=id,correct')),
)

// ───── админ колледжа ─────
console.log('\n[админ колледжа]')
const newStudent = `new-${Date.now()}@demo.example.com`
await check('создаёт студента в своём колледже', 'allowed', async () => {
  const r = await A.req('POST', '/users', {
    email: newStudent,
    password: PASS,
    role: roles.student,
    full_name: 'Новый',
    student_id: newStudent,
  })
  const u = await dx.get(`/users/${r.id}?fields=institution`)
  if (u.institution !== inst1)
    throw Object.assign(new Error('колледж=' + u.institution), { status: 500 })
  return 'ok'
})
await check('создаёт студента в ЧУЖОМ колледже', 'denied', async () => {
  const em = `x-${Date.now()}@demo.example.com`
  await A.req('POST', '/users', {
    email: em,
    password: PASS,
    role: roles.student,
    full_name: 'Чужой',
    student_id: em,
    institution: inst2,
  })
  // ответ может быть пустым (создан, но админу не виден) — смотрим в базу
  const u = (await dx.get(`/users?filter[email][_eq]=${em}&fields=institution`))[0]
  if (u && u.institution !== inst1)
    throw Object.assign(new Error('создан в чужом колледже ' + u.institution), { status: 500 })
})
await check('создаёт админа', 'denied', () =>
  A.req('POST', '/users', {
    email: `adm-${Date.now()}@demo.example.com`,
    password: PASS,
    role: roles.admin,
    full_name: 'x',
    student_id: `a${Date.now()}`,
  }),
)
await check('повышает студента до преподавателя', 'allowed', () =>
  A.req('PATCH', `/users/${sid}`, { role: roles.teacher }).then(() =>
    A.req('PATCH', `/users/${sid}`, { role: roles.student }),
  ),
)
await check('повышает студента до админа', 'denied', () =>
  A.req('PATCH', `/users/${sid}`, { role: roles.admin }),
)
await check('повышает себя до суперадмина', 'denied', () =>
  A.req('PATCH', `/users/${aid}`, { role: roles.superadmin }),
)
await check('меняет студенту xp', 'denied', () => A.req('PATCH', `/users/${sid}`, { xp: 100 }))
await check('меняет студента другого колледжа', 'denied', () =>
  A.req('PATCH', `/users/${studentB}`, { callsign: 'x' }),
)
await check('видит пользователей другого колледжа', 'denied', () =>
  A.req('GET', `/users/${studentB}?fields=id`),
)
await check('читает журнал аудита', 'allowed', () => A.req('GET', '/items/audit_logs'))

// ───── супер-админ ─────
console.log('\n[супер-админ]')
await check('повышает преподавателя до админа', 'allowed', () =>
  SA.req('PATCH', `/users/${teacher2}`, { role: roles.admin }).then(() =>
    SA.req('PATCH', `/users/${teacher2}`, { role: roles.teacher }),
  ),
)
await check('видит студента чужого колледжа', 'allowed', () =>
  SA.req('GET', `/users/${studentB}?fields=id`),
)
await check('меняет себе роль', 'denied', () =>
  SA.req('PATCH', `/users/${said}`, { role: roles.student }),
)
await check('назначает роль Administrator (технический админ Directus)', 'denied', async () => {
  const adm = (await dx.get('/roles?filter[admin_access][_eq]=true&fields=id'))[0].id
  await SA.req('PATCH', `/users/${sid}`, { role: adm })
})
await check('меняет схему (создаёт коллекцию)', 'denied', () =>
  SA.req('POST', '/collections', { collection: 'hack', schema: {} }),
)
await check('меняет права ролей', 'denied', () =>
  SA.req('POST', '/permissions', { role: roles.student, collection: 'courses', action: 'delete' }),
)

console.log(results.join('\n'))
console.log(
  `\nИтого: ${total - failed} из ${total} проверок прошли${failed ? ` — ПРОВАЛОВ: ${failed}` : ''}`,
)
process.exit(failed ? 1 : 0)
