// Тест самих правил доступа (без сервера): ловит опасные изменения в access.mjs ещё до применения.
import { describe, expect, it } from 'vitest'
import { buildPermissions } from './access.mjs'
import { COLLECTIONS, USER_FIELDS } from './model.mjs'

const ids = {
  student: 'R-student',
  teacher: 'R-teacher',
  admin: 'R-admin',
  superadmin: 'R-superadmin',
}
const perms = buildPermissions(ids)
const roleName = (id) => (id === null ? 'public' : Object.keys(ids).find((k) => ids[k] === id))
const WRITE = ['create', 'update']
/** Поля, которые клиент менять не должен ни при какой роли: их считает сервер. */
const SERVER_ONLY = {
  directus_users: ['xp', 'level', 'rank', 'coins', 'created'],
  enrollments: ['progress_percent', 'completed_at', 'enrolled_at'],
  session_progress: ['xp_earned', 'completed_at'],
  quiz_attempts: ['score', 'passed'],
  submissions: ['status', 'graded_at', 'submitted_at'],
  leaderboard: ['xp', 'level', 'rank'],
}

describe('права ролей', () => {
  it('нет дублей: на роль+таблицу+действие ровно одна запись (иначе Directus 10 их склеит)', () => {
    const seen = new Set()
    for (const p of perms) {
      const k = `${p.role}|${p.collection}|${p.action}`
      expect(seen.has(k), k).toBe(false)
      seen.add(k)
    }
  })

  it('ни одна роль не может писать серверные поля', () => {
    for (const p of perms) {
      const guarded = SERVER_ONLY[p.collection]
      if (!guarded || !WRITE.includes(p.action)) continue
      const fields = p.fields ?? []
      if (fields.includes('*'))
        expect.fail(
          `${roleName(p.role)} → ${p.collection}.${p.action}: «*» разрешает писать серверные поля`,
        )
      for (const f of guarded)
        expect(fields, `${roleName(p.role)} ${p.collection}.${p.action}`).not.toContain(f)
    }
  })

  it('у публичного доступа только чтение колледжей и витрины', () => {
    const pub = perms
      .filter((p) => p.role === null)
      .map((p) => `${p.collection}:${p.action}`)
      .sort()
    expect(pub).toEqual(['institutions:read', 'site_stats:read'])
  })

  it('студент не создаёт курсы, пользователей, оценки, уведомления, рейтинг, аудит', () => {
    const has = (c, a) =>
      perms.some((p) => p.role === ids.student && p.collection === c && p.action === a)
    for (const c of [
      'courses',
      'directus_users',
      'notifications',
      'leaderboard',
      'audit_logs',
      'institutions',
      'groups',
    ]) {
      expect(has(c, 'create'), c).toBe(false)
    }
    expect(has('submissions', 'delete')).toBe(false)
  })

  it('студент не видит правильные ответы тестов', () => {
    const p = perms.find(
      (x) => x.role === ids.student && x.collection === 'quiz_questions' && x.action === 'read',
    )
    expect(p.fields).not.toContain('correct')
    expect(p.fields).not.toContain('*')
  })

  it('никто, кроме супер-админа, не создаёт и не удаляет колледжи', () => {
    for (const p of perms.filter((x) => x.collection === 'institutions' && x.action !== 'read'))
      expect(roleName(p.role)).toBe('superadmin')
  })

  it('владельца записи клиент не присылает (его ставит сервер): student/author/reporter не в списке полей создания', () => {
    const create = (role, c) =>
      perms.find((p) => p.role === ids[role] && p.collection === c && p.action === 'create')
    for (const [role, c, f] of [
      ['student', 'enrollments', 'student'],
      ['student', 'session_progress', 'student'],
      ['student', 'submissions', 'student'],
      ['student', 'quiz_attempts', 'student'],
      ['student', 'board_completions', 'student'],
      ['teacher', 'courses', 'owner'],
      ['teacher', 'quizzes', 'author'],
      ['teacher', 'board_tasks', 'author'],
      ['admin', 'directus_users', 'institution'],
      ['admin', 'groups', 'institution'],
    ]) {
      expect(create(role, c).fields, `${role} ${c}.${f}`).not.toContain(f)
      expect(create(role, c).presets ?? {}, `${role} ${c} preset`).toHaveProperty(f)
    }
  })

  it('админ колледжа назначает только студентов и преподавателей, супер-админ — любые роли, себя менять нельзя', () => {
    const upd = (role) =>
      perms.find(
        (p) => p.role === ids[role] && p.collection === 'directus_users' && p.action === 'update',
      )
    expect(JSON.stringify(upd('admin').validation)).toContain(ids.student)
    expect(JSON.stringify(upd('admin').validation)).not.toContain(ids.admin)
    expect(JSON.stringify(upd('superadmin').validation)).toContain(ids.admin)
    expect(JSON.stringify(upd('superadmin').permissions)).toContain('_neq') // не себя
    expect(upd('student').fields).toEqual(['callsign', 'avatar', 'password'])
  })

  it('каждая роль из прав существует в модели, а коллекции — в схеме', () => {
    const known = new Set([
      ...COLLECTIONS.map((c) => c.name),
      'submissions_files',
      'directus_users',
      'directus_roles',
      'directus_files',
    ])
    for (const p of perms) expect(known.has(p.collection), p.collection).toBe(true)
    expect(USER_FIELDS.map((f) => f.field)).toEqual(
      expect.arrayContaining(['xp', 'level', 'rank', 'coins']),
    )
  })
})
