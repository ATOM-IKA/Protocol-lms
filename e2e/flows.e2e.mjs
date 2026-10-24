#!/usr/bin/env node
// Сквозная проверка ЗАПИСИ данных настоящим кодом приложения: курс → запись → прогресс → сдача → оценка,
// доска, тесты, посещаемость, создание и повышение пользователей. Только для dev-сервера Vite
// (модули приложения подгружаются из /src). Нужны демо-аккаунты (directus/apply.mjs --seed-demo).
//   E2E_BASE=http://127.0.0.1:5173 DEMO_PASSWORD=... node e2e/flows.e2e.mjs
import { randomBytes } from 'node:crypto'
import { chromium } from 'playwright'
import { demoLogin, demoPassword } from '../directus/model.mjs'
import { loadSecrets } from '../directus/lib.mjs'

loadSecrets(process.env.E2E_ENV ?? '.env.audit') // DEMO_PASSWORD из окружения или файла, игнорируемого git

const BASE = (process.env.E2E_BASE ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const TAB = { student: 'Студент', teacher: 'Препод.', admin: 'Админ' }
const results = []
let failed = 0
const assert = (c, m) => {
  if (!c) throw new Error(m)
}
async function step(name, fn) {
  try {
    const r = await fn()
    results.push(`  ✓ ${name}`)
    return r
  } catch (e) {
    failed++
    results.push(`  ✗ ПРОВАЛ ${name}\n      ${String(e.message).split('\n')[0].slice(0, 220)}`)
    return undefined
  }
}
/** ожидаем, что действие ОТКЛОНЕНО сервером */
async function denied(name, fn) {
  try {
    await fn()
    failed++
    results.push(`  ✗ ПРОВАЛ ${name}\n      действие прошло, а должно быть запрещено`)
  } catch {
    results.push(`  ✓ ${name}`)
  }
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })
async function open(tab, identity, password = demoPassword()) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('pl-intro-seen', '1')
    } catch {
      /* ignore */
    }
  })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: TAB[tab], exact: true }).click()
  const inputs = page.locator('form input:not([type=checkbox])')
  await inputs.nth(0).fill(identity)
  await inputs.nth(1).fill(password)
  await page.getByText('Я даю согласие').first().click()
  await page.getByRole('button', { name: /Вход →/ }).click()
  await page.waitForURL((u) => u.pathname !== '/login', { timeout: 15000 })
  const user = JSON.parse(await page.evaluate(() => localStorage.getItem('protocol-auth')))
  await page.goto(`${BASE}/portal`, { waitUntil: 'networkidle' })
  return { ctx, page, user }
}
/** вызвать функцию слоя данных приложения внутри страницы (под сессией этого пользователя) */
const call = (page, mod, fn, ...args) =>
  page.evaluate(
    async ([m, f, a]) => (await import(/* @vite-ignore */ m))[f](...a),
    [`/src/entities/${mod}/service.ts`, fn, args],
  )

const T = await open('teacher', demoLogin('teacher'))
const S = await open('student', demoLogin('student'))
const A = await open('admin', demoLogin('admin'))
const stamp = Date.now()
const NEW_PASSWORD = `${randomBytes(9).toString('base64url')}aZ1` // одноразовый пароль тестового пользователя

console.log('\n[преподаватель создаёт учебный материал]')
const courseId = await step('создаёт курс (владельца и колледж ставит сервер)', async () =>
  call(T.page, 'course', 'createCourse', T.user.id, T.user.fullName, T.user.institutionId),
)
const course = {}
await step('добавляет раздел и урок', async () => {
  await call(T.page, 'course', 'addSection', courseId, 1)
  const c = await call(T.page, 'course', 'fetchCourse', courseId)
  course.sectionId = c.sections[0].id
  await call(T.page, 'course', 'addLesson', courseId, course.sectionId, 1)
  const c2 = await call(T.page, 'course', 'fetchCourse', courseId)
  course.lessonId = c2.sections[0].lessons[0].id
  assert(course.lessonId, 'урок не создан')
})
await step('добавляет второй урок для сдачи с файлом', async () => {
  await call(T.page, 'course', 'addLesson', courseId, course.sectionId, 2)
  const c = await call(T.page, 'course', 'fetchCourse', courseId)
  const l2 = c.sections[0].lessons.find((l) => String(l.id) !== String(course.lessonId))
  assert(l2, 'второй урок не создан')
  course.lesson2Id = l2.id
  await call(T.page, 'course', 'updateLesson', l2.id, { open: true, submission: true })
})
await step('публикует курс и открывает урок для сдачи работ', async () => {
  await call(T.page, 'course', 'updateCourse', courseId, {
    title: `E2E курс ${stamp}`,
    status: 'published',
  })
  await call(T.page, 'course', 'updateLesson', course.lessonId, { open: true, submission: true })
})
const taskTitle = `E2E задание ${stamp}`
await step('публикует задание на доске', async () =>
  call(T.page, 'board', 'publishTask', {
    authorId: T.user.id,
    title: taskTitle,
    description: 'e2e',
    target: 'all',
    rewardCoins: 5,
    rewardXp: 10,
    institutionId: T.user.institutionId,
  }),
)
const quizId = await step('создаёт тест с вопросом', async () => {
  const id = await call(T.page, 'quiz', 'createQuiz', {
    courseId,
    authorId: T.user.id,
    institutionId: T.user.institutionId,
    title: `E2E тест ${stamp}`,
    published: true,
    passScore: 50,
  })
  await call(T.page, 'quiz', 'addQuestion', {
    quizId: id,
    text: '2+2?',
    type: 'single',
    options: ['3', '4'],
    correct: ['4'],
    points: 1,
    order: 1,
  })
  return id
})

console.log('\n[студент учится]')
await step('видит опубликованный курс своего колледжа', async () => {
  const list = await call(S.page, 'course', 'fetchCourses')
  assert(
    list.some((c) => String(c.id) === String(courseId)),
    `курса нет среди ${list.length} доступных`,
  )
})
await step('записывается на курс', async () => {
  await call(S.page, 'enrollment', 'enroll', courseId, S.user.id)
})
await step('отмечает урок пройденным', async () => {
  await call(S.page, 'progress', 'setLessonDone', courseId, S.user.id, course.lessonId, true)
})
const sub = {}
await step('сдаёт работу', async () => {
  await call(S.page, 'submission', 'submitWork', {
    courseId,
    lessonId: course.lessonId,
    studentId: S.user.id,
    text: 'моя работа',
    files: [],
  })
  const mine = await call(S.page, 'submission', 'fetchMyCourseSubmissions', courseId, S.user.id)
  assert(mine.length === 1, `работ у студента: ${mine.length}`)
})
await step('сдаёт работу с вложенным файлом', async () => {
  await S.page.evaluate(
    async ([c, l, u]) => {
      const m = await import('/src/entities/submission/service.ts')
      await m.submitWork({
        courseId: c,
        lessonId: l,
        studentId: u,
        text: 'с файлом',
        files: [new File(['hello e2e'], 'hello.txt', { type: 'text/plain' })],
      })
    },
    [courseId, course.lesson2Id, S.user.id],
  )
  const mine = await call(S.page, 'submission', 'fetchMyCourseSubmissions', courseId, S.user.id)
  const withFile = mine.find((x) => x.text === 'с файлом')
  assert(withFile, 'работа с файлом не найдена')
  assert(withFile.fileUrls.length === 1, `файлов в работе: ${withFile.fileUrls.length}`)
})
await step('видит задание на доске и отправляет выполнение', async () => {
  const tasks = await call(S.page, 'board', 'fetchTasksForStudent', S.user.groupId || undefined)
  const t = tasks.find((x) => x.title === taskTitle)
  assert(t, 'задания нет у студента')
  await call(S.page, 'board', 'submitCompletion', t.id, S.user.id)
})
await step('проходит тест', async () => {
  const q = await call(S.page, 'quiz', 'fetchQuizForTake', quizId)
  assert(q, 'тест не открылся')
  await call(S.page, 'quiz', 'submitAttempt', quizId, S.user.id, { 1: ['4'] })
})
await step('студент не видит правильные ответы теста', async () => {
  const q = await S.page.evaluate(
    async (id) => (await import('/src/entities/quiz/service.ts')).fetchQuizQuestions(id),
    quizId,
  )
  assert(
    q.every((x) => !x.correct || x.correct.length === 0),
    'ответы доступны студенту',
  )
})
await denied('студент не может записать на курс другого человека', async () => {
  await S.page.evaluate(
    async ([c, u]) => {
      const m = await import('/src/shared/api/directus.ts')
      await m.createRec('enrollments', { course: m.asId(c), student: u })
    },
    [courseId, T.user.id],
  )
})
await denied('студент не может начислить себе опыт', async () => {
  await S.page.evaluate(async (u) => {
    const m = await import('/src/shared/api/directus.ts')
    await m.userUpdate(u, { xp: 99999 })
  }, S.user.id)
})

console.log('\n[преподаватель проверяет]')
await step('видит сданную работу и выставляет оценку', async () => {
  const list = await call(T.page, 'submission', 'fetchCourseSubmissions', courseId)
  assert(list.length === 2, `работ: ${list.length}`)
  sub.id = list.find((x) => x.text === 'моя работа').id
  assert(list[0].studentName, 'нет имени студента в списке работ')
  await call(T.page, 'submission', 'gradeSubmission', sub.id, 5, 'отлично')
})
await step('отмечает посещаемость', async () => {
  await call(T.page, 'attendance', 'setAttendance', courseId, course.lessonId, S.user.id, 'present')
})
await step('принимает выполнение задания', async () => {
  const comps = await call(T.page, 'board', 'fetchCompletionsForAuthor', T.user.id)
  const c = comps.find((x) => x.taskTitle === taskTitle)
  assert(c, 'выполнения нет в списке преподавателя')
  await call(T.page, 'board', 'reviewCompletion', c.id, 'approved')
})
await step('видит записанных студентов курса', async () => {
  const e = await call(T.page, 'enrollment', 'fetchCourseEnrollments', courseId)
  assert(e.length === 1, `записей: ${e.length}`)
})
await denied('преподаватель не может править курс в чужом колледже/чужой курс', async () => {
  await T.page.evaluate(async () => {
    const m = await import('/src/shared/api/directus.ts')
    await m.updateRec('courses', 999999, { title: 'x' })
  })
})

console.log('\n[админ колледжа: пользователи и повышение роли]')
const newId = `e2e-${stamp}`
const created = {}
await step('создаёт студента (почту вводить не нужно)', async () => {
  await call(A.page, 'admin', 'createUser', {
    email: '',
    password: NEW_PASSWORD,
    fullName: 'E2E Новый',
    studentId: newId,
    callsign: '',
    role: 'student',
    institutionId: '',
  })
  const users = await call(A.page, 'admin', 'fetchUsers')
  created.user = users.find((u) => u.studentId === newId)
  assert(created.user, 'пользователь не найден в списке')
  assert(
    created.user.institutionShort === 'БИК',
    `колледж подставлен неверно: ${created.user.institutionShort}`,
  )
})
await step('новый студент входит по своему номеру', async () => {
  const N = await open('student', newId, NEW_PASSWORD)
  assert(N.user.role === 'student', 'роль')
  await N.ctx.close()
})
await step('админ повышает студента до преподавателя', async () => {
  await call(A.page, 'admin', 'updateUser', created.user.id, { role: 'teacher' })
  const N = await open('teacher', newId, NEW_PASSWORD)
  assert(N.user.role === 'teacher', `роль после повышения: ${N.user.role}`)
  await N.ctx.close()
})
await denied('админ колледжа не может сделать пользователя админом', async () => {
  await call(A.page, 'admin', 'updateUser', created.user.id, { role: 'admin' })
})
await step('админ понижает обратно и удаляет тестового пользователя', async () => {
  await call(A.page, 'admin', 'updateUser', created.user.id, { role: 'student' })
  await call(A.page, 'admin', 'deleteUser', created.user.id)
  const users = await call(A.page, 'admin', 'fetchUsers')
  assert(!users.some((u) => u.studentId === newId), 'пользователь не удалён')
})
await step('админ видит статистику колледжа', async () => {
  const s = await call(A.page, 'admin', 'fetchStats', A.user.institutionId)
  assert(s.students >= 1, 'нет студентов в статистике')
})

console.log('\n[уборка]')
await step('преподаватель удаляет тестовый курс и тест', async () => {
  await call(T.page, 'quiz', 'deleteQuiz', quizId)
  await call(T.page, 'course', 'deleteCourse', courseId)
})

for (const x of [T, S, A]) await x.ctx.close()
await browser.close()
console.log(results.join('\n'))
console.log(
  `\nИтого: ${results.filter((r) => r.startsWith('  ✓')).length} из ${results.length} шагов прошли${failed ? ` — ПРОВАЛОВ: ${failed}` : ''}`,
)
process.exit(failed ? 1 : 0)
