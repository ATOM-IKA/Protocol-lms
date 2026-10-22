// Сид курса ОП.16 в PocketBase.
//
// Запуск из корня проекта (E:\protocol-lms):
//   node pocketbase/seed/seed-op16.mjs <student_id_преподавателя> <пароль> [URL_PocketBase]
//
// Пример:
//   node pocketbase/seed/seed-op16.mjs 2024-teacher SuperPass123 http://127.0.0.1:8090
//
// URL по умолчанию берётся из VITE_POCKETBASE_URL (.env) или http://127.0.0.1:8090.
// Скрипт входит под преподавателем и создаёт курс + разделы + уроки с контентом.

import PocketBase from 'pocketbase'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { OP16 } from './op16-content.mjs'

const [, , identity, password, urlArg] = process.argv

if (!identity || !password) {
  console.error('Использование: node pocketbase/seed/seed-op16.mjs <student_id_преподавателя> <пароль> [URL]')
  process.exit(1)
}

function readEnvUrl() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
    const env = readFileSync(join(root, '.env'), 'utf8')
    const m = env.match(/VITE_POCKETBASE_URL\s*=\s*(.+)/)
    return m ? m[1].trim() : null
  } catch {
    return null
  }
}

const url = urlArg || readEnvUrl() || 'http://127.0.0.1:8090'
const pb = new PocketBase(url)
pb.autoCancellation(false)

async function main() {
  console.log('PocketBase:', url)
  const auth = await pb.collection('users').authWithPassword(identity, password)
  const me = auth.record
  if (me.role !== 'teacher' && me.role !== 'admin') {
    throw new Error(`Аккаунт "${identity}" не преподаватель (role=${me.role}). Войдите преподавателем или админом.`)
  }
  if (!me.institution) throw new Error('У преподавателя не указано учебное заведение (institution).')
  console.log('Вход выполнен:', me.full_name || me.student_id, '| роль:', me.role)

  // курс
  const course = await pb.collection('courses').create({
    title: OP16.title,
    subtitle: OP16.subtitle,
    category: OP16.category,
    accent: OP16.accent,
    instructor: OP16.instructor,
    owner: me.id,
    institution: me.institution,
    status: 'draft',
    total_hours: OP16.totalHours,
  })
  console.log('Курс создан:', course.id)

  let sIndex = 0
  let globalLesson = 0
  for (const sec of OP16.sections) {
    const section = await pb.collection('sections').create({
      course: course.id,
      title: sec.title,
      order: sIndex++,
    })
    console.log('  Раздел:', sec.title)

    let lIndex = 0
    for (const l of sec.lessons) {
      await pb.collection('lessons').create({
        section: section.id,
        course: course.id,
        title: l.title,
        type: l.type,
        content: JSON.stringify(l.blocks),
        duration_hours: l.hours,
        xp: l.xp,
        order: lIndex++,
        open: globalLesson === 0, // первый урок открыт, остальные откроет преподаватель
        submission: !!l.submission, // практики принимают работы, лекции — нет
      })
      globalLesson++
      console.log('    Урок:', l.title, `(${l.type}, ${l.hours}ч, +${l.xp}xp)`)
    }
  }

  console.log(`\nГотово: ${globalLesson} уроков. Курс создан как черновик, открыт только первый урок.`)
  console.log('Откройте кабинет преподавателя → «Опубликовать», и открывайте уроки студентам по мере прохождения (значок «глаз»).')
}

main().catch((err) => {
  console.error('\nОШИБКА:', err?.message || err)
  if (err?.response) console.error(JSON.stringify(err.response, null, 2))
  process.exit(1)
})
