// Права четырёх ролей PROTOCOL LMS (Directus 10: права привязаны к роли, не к политике).
//
// Базовые принципы:
//  • ничего не разрешено по умолчанию — только перечисленное ниже;
//  • студент/преподаватель/админ видят данные только СВОЕГО колледжа ($CURRENT_USER.institution);
//  • серверные поля (xp, level, rank, coins, score, passed, progress_percent, xp_earned, graded_at …)
//    не входят ни в один список «fields» на запись — их меняет только серверное расширение;
//  • «владение» дочерних записей (раздел/урок/тест чужого курса) при СОЗДАНИИ Directus декларативно
//    проверить не умеет — это закрывает серверный хук (directus/extension, фаза 2).

const ME = '$CURRENT_USER'
const INST = '$CURRENT_USER.institution'
const mine = (field = 'institution') => ({ [field]: { _eq: INST } })
const own = (field) => ({ [field]: { _eq: ME } })
const and = (...a) => ({ _and: a })
const or = (...a) => ({ _or: a })
const published = { status: { _eq: 'published' } }
const ALL = ['*']
const STATS_FIELDS = ['courses', 'students', 'hours', 'updated_at']

/**
 * Поля пользователя. ВАЖНО: в Directus 10 на роль+таблицу+действие работает ОДНА запись прав, поэтому
 * «свои поля» и «поля одноклассников» разделить нельзя. Студент видит одноклассников по общему набору
 * без email и студенческого номера (номер — это логин, его студент и так знает).
 */
const U_STUDENT = [
  'id',
  'full_name',
  'callsign',
  'avatar',
  'role',
  'institution',
  'group',
  'xp',
  'level',
  'rank',
  'coins',
  'created',
  'status',
]
const U_STAFF = [
  'id',
  'email',
  'full_name',
  'student_id',
  'callsign',
  'avatar',
  'role',
  'institution',
  'group',
  'xp',
  'level',
  'rank',
  'coins',
  'created',
  'status',
]
/** Что админ может ПИСАТЬ в профиль (xp/level/rank/coins — никогда) */
const U_WRITE = [
  'email',
  'password',
  'full_name',
  'student_id',
  'callsign',
  'avatar',
  'role',
  'group',
  'status',
]

/** ids: { student, teacher, admin, superadmin } — uuid ролей, проставляются apply.mjs */
export function buildPermissions(ids) {
  const out = []
  /** grant(роль, коллекция, действие, { filter, fields, validation, presets }) */
  const grant = (role, collection, action, o = {}) =>
    out.push({
      role: role === null ? null : ids[role],
      collection,
      action,
      permissions: o.filter ?? {},
      validation: o.validation ?? {},
      presets: o.presets ?? null,
      fields: o.fields ?? ALL,
    })
  const LMS = ['student', 'teacher', 'admin', 'superadmin']
  const STAFF = ['teacher', 'admin']
  const assignable = (...keys) => ({ role: { _in: keys.map((k) => ids[k]) } })

  // ───── справочники, нужные всем ─────
  const INST_PUBLIC = ['id', 'name', 'short_name', 'logo', 'default_accent']
  grant(null, 'institutions', 'read', { fields: INST_PUBLIC }) // выбор колледжа на экране входа (до входа)
  grant(null, 'site_stats', 'read', { fields: STATS_FIELDS }) // витрина главной (до входа)
  for (const r of LMS) {
    grant(r, 'institutions', 'read', { fields: INST_PUBLIC })
    grant(r, 'site_stats', 'read', { fields: STATS_FIELDS })
    grant(r, 'directus_roles', 'read', { fields: ['id', 'name'] }) // чтобы по role.name определить роль
  }
  grant('superadmin', 'institutions', 'create')
  grant('superadmin', 'institutions', 'update')
  grant('superadmin', 'institutions', 'delete')

  // ───── пользователи ─────
  grant('student', 'directus_users', 'read', { filter: mine(), fields: U_STUDENT })
  grant('student', 'directus_users', 'update', {
    filter: own('id'),
    fields: ['callsign', 'avatar', 'password'],
  })
  grant('teacher', 'directus_users', 'read', { filter: mine(), fields: U_STAFF })
  grant('teacher', 'directus_users', 'update', {
    filter: own('id'),
    fields: ['callsign', 'avatar', 'password'],
  })
  // админ колледжа: только студенты/преподаватели СВОЕГО колледжа; себя и других админов трогать не может
  grant('admin', 'directus_users', 'read', { filter: mine(), fields: U_STAFF })
  grant('admin', 'directus_users', 'create', {
    fields: U_WRITE, // institution нет в списке: подставляется заготовкой и переопределена быть не может
    presets: { institution: INST },
    validation: assignable('student', 'teacher'),
  })
  grant('admin', 'directus_users', 'update', {
    filter: and(mine(), assignable('student', 'teacher')),
    fields: U_WRITE,
    validation: assignable('student', 'teacher'),
  })
  grant('admin', 'directus_users', 'delete', {
    filter: and(mine(), assignable('student', 'teacher')),
  })
  grant('superadmin', 'directus_users', 'read', { fields: U_STAFF })
  grant('superadmin', 'directus_users', 'create', {
    fields: [...U_WRITE, 'institution'],
    validation: assignable('student', 'teacher', 'admin', 'superadmin'),
  })
  grant('superadmin', 'directus_users', 'update', {
    filter: { id: { _neq: ME } }, // себя через API менять нельзя — защита от самоповышения/самопонижения
    fields: [...U_WRITE, 'institution'],
    validation: assignable('student', 'teacher', 'admin', 'superadmin'),
  })
  grant('superadmin', 'directus_users', 'delete', { filter: { id: { _neq: ME } } })

  // ───── группы ─────
  for (const r of ['student', 'teacher']) grant(r, 'groups', 'read', { filter: mine() })
  grant('admin', 'groups', 'read', { filter: mine() })
  grant('admin', 'groups', 'create', {
    fields: ['specialty', 'index', 'start_year', 'curator'], // колледж подставляет сервер
    presets: { institution: INST },
  })
  grant('admin', 'groups', 'update', { filter: mine() })
  grant('admin', 'groups', 'delete', { filter: mine() })
  for (const a of ['read', 'create', 'update', 'delete']) grant('superadmin', 'groups', a)

  // ───── курсы ─────
  const COURSE_FIELDS = [
    'title',
    'subtitle',
    'category',
    'icon',
    'accent',
    'instructor',
    'status',
    'total_hours',
    'thumbnail',
  ]
  grant('student', 'courses', 'read', { filter: and(published, mine()) })
  grant('teacher', 'courses', 'read', { filter: or(own('owner'), and(published, mine())) })
  grant('teacher', 'courses', 'create', {
    fields: COURSE_FIELDS,
    presets: { owner: ME, institution: INST, status: 'draft' },
  })
  grant('teacher', 'courses', 'update', { filter: own('owner'), fields: COURSE_FIELDS })
  grant('teacher', 'courses', 'delete', { filter: own('owner') })
  grant('admin', 'courses', 'read', { filter: mine() })
  grant('admin', 'courses', 'create', {
    fields: [...COURSE_FIELDS, 'owner'],
    presets: { owner: ME, institution: INST },
  })
  grant('admin', 'courses', 'update', { filter: mine(), fields: [...COURSE_FIELDS, 'owner'] })
  grant('admin', 'courses', 'delete', { filter: mine() })
  for (const a of ['read', 'create', 'update', 'delete']) grant('superadmin', 'courses', a)

  // ───── разделы и уроки (доступ через курс) ─────
  for (const c of ['sections', 'lessons']) {
    grant('student', c, 'read', { filter: { course: and(published, mine()) } })
    grant('teacher', c, 'read', { filter: { course: or(own('owner'), and(published, mine())) } })
    grant('teacher', c, 'create', { fields: ALL })
    grant('teacher', c, 'update', { filter: { course: own('owner') } })
    grant('teacher', c, 'delete', { filter: { course: own('owner') } })
    grant('admin', c, 'read', { filter: { course: mine() } })
    grant('admin', c, 'create')
    grant('admin', c, 'update', { filter: { course: mine() } })
    grant('admin', c, 'delete', { filter: { course: mine() } })
    for (const a of ['read', 'create', 'update', 'delete']) grant('superadmin', c, a)
  }

  // ───── записи на курсы ─────
  grant('student', 'enrollments', 'read', { filter: own('student') })
  grant('student', 'enrollments', 'create', { fields: ['course'], presets: { student: ME } })
  grant('student', 'enrollments', 'delete', { filter: own('student') })
  grant('teacher', 'enrollments', 'read', { filter: { course: own('owner') } })
  grant('teacher', 'enrollments', 'delete', { filter: { course: own('owner') } })
  grant('admin', 'enrollments', 'read', { filter: { course: mine() } })
  grant('admin', 'enrollments', 'delete', { filter: { course: mine() } })
  for (const a of ['read', 'delete']) grant('superadmin', 'enrollments', a)

  // ───── прогресс по урокам ─────
  grant('student', 'session_progress', 'read', { filter: own('student') })
  grant('student', 'session_progress', 'create', {
    fields: ['course', 'lesson', 'completed'],
    presets: { student: ME },
  })
  grant('student', 'session_progress', 'update', { filter: own('student'), fields: ['completed'] })
  grant('student', 'session_progress', 'delete', { filter: own('student') })
  grant('teacher', 'session_progress', 'read', { filter: { course: own('owner') } })
  grant('admin', 'session_progress', 'read', { filter: { course: mine() } })
  grant('superadmin', 'session_progress', 'read')

  // ───── комментарии ─────
  grant('student', 'comments', 'read', { filter: { course: and(published, mine()) } })
  grant('teacher', 'comments', 'read', { filter: { course: mine() } })
  grant('admin', 'comments', 'read', { filter: { course: mine() } })
  grant('superadmin', 'comments', 'read')
  for (const r of LMS) {
    grant(r, 'comments', 'create', { fields: ['course', 'text'], presets: { author: ME } })
    grant(r, 'comments', 'update', { filter: own('author'), fields: ['text'] })
  }
  grant('student', 'comments', 'delete', { filter: own('author') })
  grant('teacher', 'comments', 'delete', { filter: own('author') })
  grant('admin', 'comments', 'delete', { filter: or(own('author'), { course: mine() }) }) // модерация в колледже
  grant('superadmin', 'comments', 'delete')

  // ───── сдача работ ─────
  grant('student', 'submissions', 'read', { filter: own('student') })
  grant('student', 'submissions', 'create', {
    fields: ['course', 'lesson', 'text', 'files'],
    presets: { student: ME },
  })
  grant('student', 'submissions', 'update', {
    filter: and(own('student'), or({ status: { _eq: 'submitted' } }, { retry: { _eq: true } })),
    fields: ['text', 'files'],
  })
  grant('teacher', 'submissions', 'read', { filter: { course: own('owner') } })
  grant('teacher', 'submissions', 'update', {
    filter: { course: own('owner') },
    fields: ['grade', 'feedback', 'retry'],
  })
  grant('admin', 'submissions', 'read', { filter: { course: mine() } })
  grant('superadmin', 'submissions', 'read')
  grant('student', 'submissions_files', 'read', { filter: { submissions_id: own('student') } })
  grant('student', 'submissions_files', 'create')
  grant('teacher', 'submissions_files', 'read', {
    filter: { submissions_id: { course: own('owner') } },
  })
  grant('admin', 'submissions_files', 'read', { filter: { submissions_id: { course: mine() } } })
  grant('superadmin', 'submissions_files', 'read')

  // ───── файлы (аватары, обложки, вложения) ─────
  for (const r of LMS) grant(r, 'directus_files', 'create')
  grant('student', 'directus_files', 'read', {
    filter: or(own('uploaded_by'), { type: { _starts_with: 'image/' } }),
  })
  grant('student', 'directus_files', 'delete', { filter: own('uploaded_by') })
  for (const r of ['teacher', 'admin', 'superadmin']) grant(r, 'directus_files', 'read')
  for (const r of ['teacher', 'admin'])
    grant(r, 'directus_files', 'delete', { filter: own('uploaded_by') })

  // ───── тесты ─────
  grant('student', 'quizzes', 'read', { filter: and({ published: { _eq: true } }, mine()) })
  grant('teacher', 'quizzes', 'read', {
    filter: or(own('author'), and({ published: { _eq: true } }, mine())),
  })
  grant('teacher', 'quizzes', 'create', {
    fields: [
      'course',
      'lesson',
      'title',
      'description',
      'time_limit',
      'pass_score',
      'reward_coins',
      'reward_xp',
      'published',
    ],
    presets: { author: ME, institution: INST },
  })
  grant('teacher', 'quizzes', 'update', {
    filter: own('author'),
    fields: [
      'title',
      'description',
      'time_limit',
      'pass_score',
      'reward_coins',
      'reward_xp',
      'published',
    ],
  })
  grant('teacher', 'quizzes', 'delete', { filter: own('author') })
  grant('admin', 'quizzes', 'read', { filter: mine() })
  grant('admin', 'quizzes', 'update', { filter: mine() })
  grant('admin', 'quizzes', 'delete', { filter: mine() })
  for (const a of ['read', 'update', 'delete']) grant('superadmin', 'quizzes', a)

  const Q_NO_ANSWER = ['id', 'quiz', 'text', 'type', 'options', 'points', 'order'] // без `correct`
  grant('student', 'quiz_questions', 'read', {
    filter: { quiz: and({ published: { _eq: true } }, mine()) },
    fields: Q_NO_ANSWER,
  })
  grant('teacher', 'quiz_questions', 'read', { filter: { quiz: own('author') } })
  grant('teacher', 'quiz_questions', 'create')
  grant('teacher', 'quiz_questions', 'update', { filter: { quiz: own('author') } })
  grant('teacher', 'quiz_questions', 'delete', { filter: { quiz: own('author') } })
  grant('admin', 'quiz_questions', 'read', { filter: { quiz: mine() } })
  grant('superadmin', 'quiz_questions', 'read')

  grant('student', 'quiz_attempts', 'read', { filter: own('student') })
  grant('student', 'quiz_attempts', 'create', {
    fields: ['quiz', 'answers'],
    presets: { student: ME },
  })
  grant('teacher', 'quiz_attempts', 'read', { filter: { quiz: own('author') } })
  grant('admin', 'quiz_attempts', 'read', { filter: { quiz: mine() } })
  grant('superadmin', 'quiz_attempts', 'read')

  // ───── посещаемость ─────
  grant('student', 'attendance', 'read', { filter: own('student') })
  const ATT = ['course', 'lesson', 'student', 'status']
  grant('teacher', 'attendance', 'read', { filter: { course: own('owner') } })
  grant('teacher', 'attendance', 'create', { fields: ATT })
  grant('teacher', 'attendance', 'update', { filter: { course: own('owner') }, fields: ['status'] })
  grant('teacher', 'attendance', 'delete', { filter: { course: own('owner') } })
  grant('admin', 'attendance', 'read', { filter: { course: mine() } })
  grant('superadmin', 'attendance', 'read')

  // ───── доска заданий ─────
  grant('student', 'board_tasks', 'read', {
    filter: and(mine(), or({ target: { _eq: 'all' } }, { group: { _eq: '$CURRENT_USER.group' } })),
  })
  grant('teacher', 'board_tasks', 'read', { filter: mine() })
  const TASK_F = ['title', 'description', 'target', 'group', 'reward_coins', 'reward_xp']
  grant('teacher', 'board_tasks', 'create', {
    fields: TASK_F,
    presets: { author: ME, institution: INST },
  })
  grant('teacher', 'board_tasks', 'update', { filter: own('author'), fields: TASK_F })
  grant('teacher', 'board_tasks', 'delete', { filter: own('author') })
  grant('admin', 'board_tasks', 'read', { filter: mine() })
  grant('admin', 'board_tasks', 'create', {
    fields: TASK_F,
    presets: { author: ME, institution: INST },
  })
  grant('admin', 'board_tasks', 'update', { filter: mine(), fields: TASK_F })
  grant('admin', 'board_tasks', 'delete', { filter: mine() })
  for (const a of ['read', 'update', 'delete']) grant('superadmin', 'board_tasks', a)

  grant('student', 'board_completions', 'read', { filter: own('student') })
  grant('student', 'board_completions', 'create', {
    fields: ['task', 'status'],
    presets: { student: ME, status: 'submitted' },
    validation: { status: { _in: ['submitted', 'declined'] } },
  })
  grant('student', 'board_completions', 'update', {
    filter: and(own('student'), { status: { _in: ['submitted', 'declined'] } }),
    fields: ['status'],
    validation: { status: { _in: ['submitted', 'declined'] } },
  })
  grant('student', 'board_completions', 'delete', {
    filter: and(own('student'), { status: { _neq: 'approved' } }),
  })
  grant('teacher', 'board_completions', 'read', { filter: { task: own('author') } })
  grant('teacher', 'board_completions', 'update', {
    filter: { task: own('author') },
    fields: ['status'],
    validation: { status: { _in: ['approved', 'rejected'] } },
  })
  grant('admin', 'board_completions', 'read', { filter: { task: mine() } })
  grant('admin', 'board_completions', 'update', {
    filter: { task: mine() },
    fields: ['status'],
    validation: { status: { _in: ['approved', 'rejected'] } },
  })
  grant('superadmin', 'board_completions', 'read')

  // ───── рейтинг, уведомления, аудит (пишет только сервер) ─────
  for (const r of ['student', 'teacher', 'admin'])
    grant(r, 'leaderboard', 'read', { filter: mine() })
  grant('superadmin', 'leaderboard', 'read')
  for (const r of LMS) {
    grant(r, 'notifications', 'read', { filter: own('user') })
    grant(r, 'notifications', 'update', { filter: own('user'), fields: ['read'] })
    grant(r, 'notifications', 'delete', { filter: own('user') })
  }
  grant('admin', 'audit_logs', 'read', { filter: mine() })
  grant('superadmin', 'audit_logs', 'read')

  // ───── QA-чек-лист ─────
  for (const r of LMS) {
    grant(r, 'qa_reports', 'create', {
      fields: ['name', 'role', 'score', 'problems', 'payload'],
      presets: { reporter: ME },
    })
    grant(r, 'qa_screenshots', 'create', { fields: ['report', 'item', 'image'] })
  }
  for (const r of ['student', 'teacher', 'admin']) {
    grant(r, 'qa_reports', 'read', { filter: own('reporter') })
    grant(r, 'qa_screenshots', 'read', { filter: { report: own('reporter') } })
  }
  grant('superadmin', 'qa_reports', 'read')
  grant('superadmin', 'qa_screenshots', 'read')
  grant('superadmin', 'qa_reports', 'delete')

  return out
}
