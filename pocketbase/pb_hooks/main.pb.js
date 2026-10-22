/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — серверная логика PocketBase (v0.22+ JSVM).
// XP начисляется ТОЛЬКО здесь: клиент не может подделать опыт/уровень/ранг.
//
// Формулы совпадают с фронтом (src/shared/lib/levels.ts).

// ---- уровень / ранг ------------------------------------------------------
function xpForLevel(level) {
  return Math.round(100 * Math.pow(level, 1.6))
}
function levelFromXp(xp) {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}
function rankFromLevel(level) {
  if (level >= 40) return 'SSS'
  if (level >= 32) return 'SS'
  if (level >= 25) return 'S'
  if (level >= 19) return 'A'
  if (level >= 14) return 'B'
  if (level >= 10) return 'C'
  if (level >= 6) return 'D'
  if (level >= 3) return 'E'
  return 'F'
}

// ---- helpers -------------------------------------------------------------
function recomputeUser(app, studentId) {
  if (!studentId) return
  // сумма xp_earned по завершённым урокам студента (идемпотентно, без дрейфа)
  const rows = app.findRecordsByFilter(
    'session_progress',
    'student = {:s} && completed = true',
    '',
    0,
    0,
    { s: studentId },
  )
  let xp = 0
  for (let i = 0; i < rows.length; i++) xp += rows[i].getInt('xp_earned')

  // + опыт за принятые задания с доски (каждое задание один раз)
  try {
    const comps = app.findRecordsByFilter('board_completions', 'student = {:s} && status = "approved"', '', 0, 0, { s: studentId })
    for (let i = 0; i < comps.length; i++) {
      try { xp += app.findRecordById('board_tasks', comps[i].getString('task')).getInt('reward_xp') } catch (e) {}
    }
  } catch (e) {}
  // + опыт за пройденные тесты (каждый тест один раз)
  try {
    const attempts = app.findRecordsByFilter('quiz_attempts', 'student = {:s} && passed = true', '', 0, 0, { s: studentId })
    const seen = {}
    for (let i = 0; i < attempts.length; i++) {
      const qid = attempts[i].getString('quiz')
      if (seen[qid]) continue
      seen[qid] = 1
      try { xp += app.findRecordById('quizzes', qid).getInt('reward_xp') } catch (e) {}
    }
  } catch (e) {}

  const level = levelFromXp(xp)
  const rank = rankFromLevel(level)

  const user = app.findRecordById('users', studentId)
  user.set('xp', xp)
  user.set('level', level)
  user.set('rank', rank)
  app.save(user)
  upsertLeaderboard(app, user)
}

// денормализованная строка рейтинга (только безопасные поля)
function upsertLeaderboard(app, user) {
  try {
    if (user.getString('role') !== 'student') return
    const col = app.findCollectionByNameOrId('leaderboard')
    let rec
    try { rec = app.findFirstRecordByFilter('leaderboard', 'user = {:u}', { u: user.id }) } catch (e) { rec = null }
    if (!rec) { rec = new Record(col); rec.set('user', user.id) }
    rec.set('name', user.getString('callsign') || user.getString('student_id') || 'USER')
    rec.set('xp', user.getInt('xp'))
    rec.set('level', user.getInt('level'))
    rec.set('rank', user.getString('rank'))
    rec.set('institution', user.getString('institution'))
    rec.set('group', user.getString('group'))
    app.save(rec)
  } catch (e) {
    console.log('leaderboard upsert error:', e)
  }
}

function recomputeEnrollment(app, studentId, courseId) {
  if (!studentId || !courseId) return
  const total = app.findRecordsByFilter('lessons', 'course = {:c}', '', 0, 0, { c: courseId })
  const done = app.findRecordsByFilter(
    'session_progress',
    'student = {:s} && course = {:c} && completed = true',
    '',
    0,
    0,
    { s: studentId, c: courseId },
  )
  const percent = total.length > 0 ? Math.round((done.length / total.length) * 100) : 0

  const enr = app.findFirstRecordByFilter(
    'enrollments',
    'student = {:s} && course = {:c}',
    { s: studentId, c: courseId },
  )
  if (enr) {
    enr.set('progress_percent', percent)
    if (percent === 100) enr.set('completed_at', new Date().toISOString())
    app.save(enr)
  }
}

function audit(app, userId, action, target, meta) {
  try {
    const col = app.findCollectionByNameOrId('audit_logs')
    const rec = new Record(col)
    rec.set('user', userId || '')
    rec.set('action', action)
    rec.set('target', target || '')
    rec.set('meta', meta || {})
    app.save(rec)
  } catch (err) {
    // журнал не должен ломать запрос
    console.log('audit failed:', err)
  }
}

// ---- session_progress: проставить xp_earned/completed_at ДО сохранения ----
function stampProgress(e) {
  try {
    const completed = e.record.getBool('completed')
    let earned = 0
    if (completed) {
      const lesson = e.app.findRecordById('lessons', e.record.getString('lesson'))
      earned = lesson ? lesson.getInt('xp') : 0
      e.record.set('completed_at', new Date().toISOString())
    } else {
      e.record.set('completed_at', null)
    }
    e.record.set('xp_earned', earned) // сервер: клиентское значение игнорируется
  } catch (err) {
    console.log('stampProgress error:', err)
  }
  e.next()
}
onRecordCreateRequest(stampProgress, 'session_progress')
onRecordUpdateRequest(stampProgress, 'session_progress')

// ---- пересчёт XP и прогресса ПОСЛЕ сохранения/удаления --------------------
function afterProgress(e) {
  e.next()
  try {
    const studentId = e.record.getString('student')
    const courseId = e.record.getString('course')
    recomputeUser(e.app, studentId)
    recomputeEnrollment(e.app, studentId, courseId)
  } catch (err) {
    console.log('afterProgress error:', err)
  }
}
onRecordAfterCreateSuccess(afterProgress, 'session_progress')
onRecordAfterUpdateSuccess(afterProgress, 'session_progress')
onRecordAfterDeleteSuccess(afterProgress, 'session_progress')

// ---- submissions: статус/оценка проставляются только сервером ------------
function isCourseTeacher(app, info, courseId) {
  try {
    const auth = info.auth
    if (!auth) return false
    if (auth.getString('role') === 'admin') return true
    const course = app.findRecordById('courses', courseId)
    return !!course && course.getString('owner') === auth.id
  } catch (err) {
    return false
  }
}

// студент создаёт сдачу → всегда 'submitted', без оценки
onRecordCreateRequest(function (e) {
  try {
    e.record.set('status', 'submitted')
    e.record.set('grade', 0)
    e.record.set('feedback', '')
    e.record.set('submitted_at', new Date().toISOString())
    e.record.set('graded_at', null)
  } catch (err) {
    console.log('submission create stamp error:', err)
  }
  e.next()
}, 'submissions')

// преподаватель → выставляет оценку (status=graded); студент → пересдаёт (сброс оценки)
onRecordUpdateRequest(function (e) {
  try {
    const info = e.requestInfo()
    const teacher = isCourseTeacher(e.app, info, e.record.getString('course'))
    if (teacher) {
      e.record.set('status', 'graded')
      e.record.set('graded_at', new Date().toISOString())
    } else {
      // студент пересдаёт: если прошлая оценка была 2 (провал) — помечаем retry (потолок опыта как у «4»)
      const original = e.app.findRecordById('submissions', e.record.id)
      const wasFail = original.getString('status') === 'graded' && original.getInt('grade') > 0 && original.getInt('grade') <= 2
      e.record.set('retry', original.getBool('retry') || wasFail)
      e.record.set('status', 'submitted')
      e.record.set('grade', 0)
      e.record.set('feedback', '')
      e.record.set('graded_at', null)
      e.record.set('submitted_at', new Date().toISOString())
    }
  } catch (err) {
    console.log('submission update guard error:', err)
  }
  e.next()
}, 'submissions')

// ---- защита сервер-only полей users от клиента ---------------------------
onRecordUpdateRequest(function (e) {
  try {
    const info = e.requestInfo()
    const auth = info.auth
    const isAdmin = auth && auth.getString('role') === 'admin'
    if (!isAdmin) {
      const original = e.app.findRecordById('users', e.record.id)
      // откатываем попытки клиента поменять защищённые поля
      e.record.set('xp', original.getInt('xp'))
      e.record.set('level', original.getInt('level'))
      e.record.set('rank', original.getString('rank'))
      e.record.set('role', original.getString('role'))
      e.record.set('institution', original.getString('institution'))
      e.record.set('coins', original.getInt('coins'))
      e.record.set('group', original.getString('group'))
    }
  } catch (err) {
    console.log('guardUserFields error:', err)
  }
  e.next()
}, 'users')

// ---- валюта (coins) и уведомления ----------------------------------------
function coinsForGrade(g) {
  return g >= 5 ? 10 : g >= 4 ? 7 : g >= 3 ? 5 : 0
}
// Монеты начисляются всем ролям, но по-разному:
//  студент  — за оценки (3–5) + принятые задания с доски;
//  препод   — за успехи студентов (по 3 за каждый пройденный урок на его курсах);
//  админ    — за охват (по 1 за каждого пользователя в его заведении; супер-админ — по всей системе).
function recomputeCoins(app, userId) {
  if (!userId) return
  let user
  try { user = app.findRecordById('users', userId) } catch (e) { return }
  const role = user.getString('role')
  let coins = 0

  if (role === 'teacher') {
    try {
      const courses = app.findRecordsByFilter('courses', 'owner = {:o}', '', 0, 0, { o: userId })
      for (let i = 0; i < courses.length; i++) {
        const passed = app.findRecordsByFilter('submissions', 'course = {:c} && status = "graded" && grade >= 3', '', 0, 0, { c: courses[i].id })
        coins += passed.length * 3
      }
    } catch (e) {}
  } else if (role === 'admin' || role === 'superadmin') {
    try {
      const inst = user.getString('institution')
      const list = inst
        ? app.findRecordsByFilter('users', 'institution = {:i}', '', 0, 0, { i: inst })
        : app.findRecordsByFilter('users', 'id != ""', '', 0, 0, {})
      coins += list.length
    } catch (e) {}
  } else {
    const subs = app.findRecordsByFilter('submissions', 'student = {:s} && status = "graded"', '', 0, 0, { s: userId })
    for (let i = 0; i < subs.length; i++) coins += coinsForGrade(subs[i].getInt('grade'))
    try {
      const comps = app.findRecordsByFilter('board_completions', 'student = {:s} && status = "approved"', '', 0, 0, { s: userId })
      for (let i = 0; i < comps.length; i++) {
        try {
          const task = app.findRecordById('board_tasks', comps[i].getString('task'))
          coins += task.getInt('reward_coins')
        } catch (e) {}
      }
    } catch (e) {}
    try {
      // сданные тесты — награда за каждый пройденный квиз один раз
      const attempts = app.findRecordsByFilter('quiz_attempts', 'student = {:s} && passed = true', '', 0, 0, { s: userId })
      const seen = {}
      for (let i = 0; i < attempts.length; i++) {
        const qid = attempts[i].getString('quiz')
        if (seen[qid]) continue
        seen[qid] = 1
        try {
          const quiz = app.findRecordById('quizzes', qid)
          coins += quiz.getInt('reward_coins')
        } catch (e) {}
      }
    } catch (e) {}
  }

  user.set('coins', coins)
  app.save(user)
}
function notify(app, userId, kind, title, text, link) {
  try {
    const col = app.findCollectionByNameOrId('notifications')
    const rec = new Record(col)
    rec.set('user', userId)
    rec.set('kind', kind)
    rec.set('title', title)
    rec.set('text', text || '')
    rec.set('link', link || '')
    rec.set('read', false)
    app.save(rec)
  } catch (err) {
    console.log('notify error:', err)
  }
}

// сдача оценена → пересчёт монет + уведомление студенту
onRecordAfterUpdateSuccess(function (e) {
  e.next()
  try {
    if (e.record.getString('status') === 'graded' && e.record.getInt('grade') > 0) {
      const sid = e.record.getString('student')
      recomputeCoins(e.app, sid)
      const link = '/app/courses/' + e.record.getString('course') + '/lessons/' + e.record.getString('lesson')
      notify(e.app, sid, 'grade', 'Работа оценена', 'Оценка: ' + e.record.getInt('grade'), link)
      // монеты преподавателя (владельца курса) за успех студента
      try {
        const course = e.app.findRecordById('courses', e.record.getString('course'))
        recomputeCoins(e.app, course.getString('owner'))
      } catch (e2) {}
    }
  } catch (err) {
    console.log('coins/notify error:', err)
  }
}, 'submissions')
onRecordAfterDeleteSuccess(function (e) {
  e.next()
  try { recomputeCoins(e.app, e.record.getString('student')) } catch (err) {}
}, 'submissions')

// имя студента для уведомлений преподавателю
function boardStudentName(app, studentId) {
  try {
    const s = app.findRecordById('users', studentId)
    return s.getString('full_name') || s.getString('student_id') || 'Студент'
  } catch (e) {
    return 'Студент'
  }
}
// уведомить автора задания о действии студента
function notifyBoardAuthor(app, record) {
  try {
    const task = app.findRecordById('board_tasks', record.getString('task'))
    const who = boardStudentName(app, record.getString('student'))
    const title = task.getString('title')
    const status = record.getString('status')
    if (status === 'submitted') notify(app, task.getString('author'), 'board', 'Задание выполнено', who + ' → «' + title + '»', '/app/board')
    else if (status === 'declined') notify(app, task.getString('author'), 'board', 'Отказ от задания', who + ' отказался: «' + title + '»', '/app/board')
  } catch (e) {
    console.log('notifyBoardAuthor error:', e)
  }
}

// доска: смена статуса выполнения
onRecordAfterUpdateSuccess(function (e) {
  e.next()
  try {
    const status = e.record.getString('status')
    const sid = e.record.getString('student')
    if (status === 'approved') {
      recomputeCoins(e.app, sid)
      recomputeUser(e.app, sid)
      try {
        const task = e.app.findRecordById('board_tasks', e.record.getString('task'))
        notify(e.app, sid, 'board', 'Задание принято', task.getString('title'), '/app/board')
        recomputeCoins(e.app, task.getString('author')) // препод тоже мог получить монеты (косвенно)
      } catch (e2) {}
    } else if (status === 'rejected') {
      recomputeCoins(e.app, sid)
      try {
        const task = e.app.findRecordById('board_tasks', e.record.getString('task'))
        notify(e.app, sid, 'board', 'Задание отклонено', task.getString('title') + ' — можно переделать', '/app/board')
      } catch (e2) {}
    } else if (status === 'submitted' || status === 'declined') {
      // студент передумал/переотправил — уведомляем преподавателя
      notifyBoardAuthor(e.app, e.record)
      recomputeCoins(e.app, sid)
    }
  } catch (err) {
    console.log('board update error:', err)
  }
}, 'board_completions')

// новое задание на доске → уведомления студентам (группа или все)
onRecordAfterCreateSuccess(function (e) {
  e.next()
  try {
    const target = e.record.getString('target')
    let students = []
    if (target === 'group' && e.record.getString('group')) {
      students = e.app.findRecordsByFilter('users', 'role = "student" && group = {:g}', '', 0, 0, { g: e.record.getString('group') })
    } else {
      const inst = e.record.getString('institution')
      students = inst
        ? e.app.findRecordsByFilter('users', 'role = "student" && institution = {:i}', '', 0, 0, { i: inst })
        : e.app.findRecordsByFilter('users', 'role = "student"', '', 0, 0, {})
    }
    for (let i = 0; i < students.length; i++) notify(e.app, students[i].id, 'board', 'Новое задание на доске', e.record.getString('title'), '/app/board')
  } catch (err) {
    console.log('board notify error:', err)
  }
}, 'board_tasks')

// студент взял/выполнил или отказался от задания → уведомление автору (преподавателю)
onRecordAfterCreateSuccess(function (e) {
  e.next()
  try {
    notifyBoardAuthor(e.app, e.record)
  } catch (err) {
    console.log('board completion notify error:', err)
  }
}, 'board_completions')

// студент отправил работу → уведомление преподавателю (владельцу курса)
onRecordAfterCreateSuccess(function (e) {
  e.next()
  try {
    const course = e.app.findRecordById('courses', e.record.getString('course'))
    notify(e.app, course.getString('owner'), 'system', 'Новая работа на проверку', course.getString('title'), '/app/teach/' + e.record.getString('course') + '/submissions')
  } catch (err) {
    console.log('submission create notify error:', err)
  }
}, 'submissions')

// ---- тесты/квизы: серверная авто-проверка --------------------------------
function parseJson(str, fallback) {
  try {
    const v = JSON.parse(str || '')
    return v == null ? fallback : v
  } catch (e) {
    return fallback
  }
}
function arraysEqualAsSets(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  const sa = a.map(String).sort()
  const sb = b.map(String).sort()
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false
  return true
}
// считает баллы попытки и выставляет score (%) и passed прямо в запись
function gradeQuizAttempt(app, record) {
  const quizId = record.getString('quiz')
  const answers = parseJson(record.getString('answers'), {})
  const questions = app.findRecordsByFilter('quiz_questions', 'quiz = {:q}', 'order', 0, 0, { q: quizId })
  let total = 0
  let earned = 0
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const pts = q.getInt('points') || 1
    total += pts
    const type = q.getString('type')
    const correct = parseJson(q.getString('correct'), [])
    const given = answers[q.id]
    let ok = false
    if (type === 'single') {
      ok = given != null && String(given) === String((correct || [])[0])
    } else if (type === 'multi') {
      ok = arraysEqualAsSets(given, correct)
    } else if (type === 'text') {
      const norm = (s) => String(s == null ? '' : s).trim().toLowerCase()
      ok = (correct || []).some((c) => norm(c) === norm(given))
    }
    if (ok) earned += pts
  }
  const score = total > 0 ? Math.round((earned / total) * 100) : 0
  let passScore = 60
  try {
    const quiz = app.findRecordById('quizzes', quizId)
    passScore = quiz.getInt('pass_score') || 60
  } catch (e) {}
  record.set('score', score)
  record.set('passed', score >= passScore)
}

// ДО сохранения попытки — считаем результат на сервере (клиентские score/passed игнорируются)
onRecordCreateRequest(function (e) {
  try {
    gradeQuizAttempt(e.app, e.record)
  } catch (err) {
    console.log('quiz grade error:', err)
  }
  e.next()
}, 'quiz_attempts')

// ПОСЛЕ сохранения — награды и уведомления
onRecordAfterCreateSuccess(function (e) {
  e.next()
  try {
    const sid = e.record.getString('student')
    const score = e.record.getInt('score')
    const passed = e.record.getBool('passed')
    recomputeCoins(e.app, sid)
    recomputeUser(e.app, sid)
    let title = ''
    try {
      const quiz = e.app.findRecordById('quizzes', e.record.getString('quiz'))
      title = quiz.getString('title')
    } catch (e2) {}
    notify(e.app, sid, 'grade', passed ? 'Тест пройден' : 'Тест завершён', title + ' — ' + score + '%', '/app/quizzes')
  } catch (err) {
    console.log('quiz reward error:', err)
  }
}, 'quiz_attempts')

// ---- аудит: вход и удаление данных ---------------------------------------
onRecordAuthRequest(function (e) {
  e.next()
  try {
    audit(e.app, e.record.id, 'auth.login', 'users:' + e.record.id, {})
  } catch (err) {
    console.log('audit login error:', err)
  }
}, 'users')

onRecordAfterDeleteSuccess(function (e) {
  e.next()
  try {
    audit(e.app, '', 'user.delete', 'users:' + e.record.id, {})
  } catch (err) {
    console.log('audit delete error:', err)
  }
}, 'users')

// ---- расширенное протоколирование ключевых действий (152-ФЗ / ПП №1678) ----
function actorId(e) {
  try {
    const a = e.requestInfo().auth
    return a ? a.id : ''
  } catch (err) {
    return ''
  }
}

// курсы: создание, удаление, публикация/снятие
onRecordAfterCreateSuccess(function (e) {
  e.next()
  try { audit(e.app, actorId(e), 'course.create', 'courses:' + e.record.id, { title: e.record.getString('title') }) } catch (err) { console.log('audit', err) }
}, 'courses')
onRecordAfterDeleteSuccess(function (e) {
  e.next()
  try { audit(e.app, '', 'course.delete', 'courses:' + e.record.id, {}) } catch (err) { console.log('audit', err) }
}, 'courses')
onRecordUpdateRequest(function (e) {
  try {
    const orig = e.app.findRecordById('courses', e.record.id)
    if (orig.getString('status') !== e.record.getString('status')) {
      audit(e.app, actorId(e), e.record.getString('status') === 'published' ? 'course.publish' : 'course.unpublish', 'courses:' + e.record.id, {})
    }
  } catch (err) { console.log('audit', err) }
  e.next()
}, 'courses')

// уроки: открытие/закрытие доступа студентам
onRecordUpdateRequest(function (e) {
  try {
    const orig = e.app.findRecordById('lessons', e.record.id)
    if (orig.getBool('open') !== e.record.getBool('open')) {
      audit(e.app, actorId(e), e.record.getBool('open') ? 'lesson.open' : 'lesson.close', 'lessons:' + e.record.id, {})
      // урок открыли → уведомить записанных студентов
      if (e.record.getBool('open')) {
        try {
          const courseId = e.record.getString('course')
          const enrolls = e.app.findRecordsByFilter('enrollments', 'course = {:c}', '', 0, 0, { c: courseId })
          const link = '/app/courses/' + courseId + '/lessons/' + e.record.id
          for (let i = 0; i < enrolls.length; i++) {
            notify(e.app, enrolls[i].getString('student'), 'system', 'Открыт новый урок', e.record.getString('title'), link)
          }
        } catch (e4) { console.log('lesson open notify error:', e4) }
      }
    }
  } catch (err) { console.log('audit', err) }
  e.next()
}, 'lessons')

// записи: запись и отписка от курса
onRecordAfterCreateSuccess(function (e) {
  e.next()
  try { audit(e.app, e.record.getString('student'), 'enroll', 'courses:' + e.record.getString('course'), {}) } catch (err) { console.log('audit', err) }
}, 'enrollments')
onRecordAfterDeleteSuccess(function (e) {
  e.next()
  try { audit(e.app, e.record.getString('student'), 'unenroll', 'courses:' + e.record.getString('course'), {}) } catch (err) { console.log('audit', err) }
}, 'enrollments')

// сдачи: выставление оценки преподавателем
onRecordUpdateRequest(function (e) {
  try {
    const orig = e.app.findRecordById('submissions', e.record.id)
    if (orig.getInt('grade') !== e.record.getInt('grade') && e.record.getInt('grade') > 0) {
      audit(e.app, actorId(e), 'submission.grade', 'submissions:' + e.record.id, { grade: e.record.getInt('grade') })
    }
  } catch (err) { console.log('audit', err) }
  e.next()
}, 'submissions')

// пользователи: смена роли (после гварда — логируем реальное изменение)
onRecordUpdateRequest(function (e) {
  try {
    const orig = e.app.findRecordById('users', e.record.id)
    if (orig.getString('role') !== e.record.getString('role')) {
      audit(e.app, actorId(e), 'user.role.change', 'users:' + e.record.id, { from: orig.getString('role'), to: e.record.getString('role') })
    }
  } catch (err) { console.log('audit', err) }
  e.next()
}, 'users')
