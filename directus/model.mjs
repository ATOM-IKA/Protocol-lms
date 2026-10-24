// Модель данных PROTOCOL LMS для Directus 10. Декларативное описание: apply.mjs создаёт по нему схему.
//
// Принципы:
//  • Пользователь один — встроенный directus_users (+ свои поля). Отдельной таблицы `users` нет.
//  • У пользователя ровно одна роль (student | teacher | admin | superadmin); повышение = смена роли.
//  • Поля xp / level / rank / coins / progress_percent / score и т.п. меняет только сервер (см. access.mjs).
//  • Ключи на пользователей — uuid (у directus_users), на остальные таблицы — integer.

/** Домен служебных адресов для входа по номеру. Держать в синхроне с src/features/auth/loginIdentity.ts (есть тест). */
export const LOGIN_DOMAIN = 'lms.protocol-lms.ru'

export const ROLES = [
  { key: 'student', name: 'student', description: 'Студент: учится, сдаёт работы, проходит тесты' },
  {
    key: 'teacher',
    name: 'teacher',
    description: 'Преподаватель: ведёт свои курсы, проверяет работы, журнал',
  },
  {
    key: 'admin',
    name: 'admin',
    description: 'Админ колледжа: пользователи, группы, модерация в своём колледже',
  },
  {
    key: 'superadmin',
    name: 'superadmin',
    description: 'Супер-админ: все колледжи и назначение админов (без доступа к схеме)',
  },
]

// ───── конструкторы полей ─────
const f = (field, type, o = {}) => ({ field, type, ...o })
const str = (field, o) => f(field, 'string', o)
const text = (field, o) => f(field, 'text', o)
const int = (field, o) => f(field, 'integer', o)
const num = (field, o) => f(field, 'float', o)
const bool = (field, def = false, o) => f(field, 'boolean', { default: def, ...o })
const json = (field, o) => f(field, 'json', o)
const ts = (field, o) => f(field, 'timestamp', o)
const created = (field = 'created') =>
  f(field, 'timestamp', { special: ['date-created'], readonly: true })
const choice = (field, values, def, o) =>
  f(field, 'string', { choices: values, default: def, ...o })
const file = (field, o) =>
  f(field, 'uuid', { special: ['file'], rel: { to: 'directus_files', onDelete: 'SET NULL' }, ...o })
/** связь многие-к-одному; to = коллекция; uuid для directus_users */
const m2o = (field, to, o = {}) =>
  f(field, to === 'directus_users' ? 'uuid' : 'integer', {
    special: ['m2o'],
    rel: { to, onDelete: o.onDelete ?? 'NO ACTION' },
    ...o,
  })

// ───── поля, добавляемые к directus_users ─────
export const USER_FIELDS = [
  str('full_name', { required: true, note: 'ФИО' }),
  str('student_id', { unique: true, note: 'Студенческий / табельный номер — логин в форме входа' }),
  str('callsign', { note: 'Позывной' }),
  m2o('institution', 'institutions', { note: 'Колледж' }),
  m2o('group', 'groups', { onDelete: 'SET NULL', note: 'Учебная группа (для студентов)' }),
  int('xp', { default: 0, note: 'Только сервер' }),
  int('level', { default: 1, note: 'Только сервер' }),
  str('rank', { default: 'F', note: 'Только сервер' }),
  int('coins', { default: 0, note: 'Только сервер' }),
  created('created'),
]

// ───── коллекции (порядок = порядок создания: сначала те, на кого ссылаются) ─────
export const COLLECTIONS = [
  {
    name: 'institutions',
    note: 'Учебные заведения',
    fields: [
      str('name', { required: true }),
      str('short_name', { required: true, unique: true }),
      file('logo'),
      choice('default_accent', ['aqua', 'lime', 'teal'], 'aqua'),
    ],
  },
  {
    name: 'groups',
    note: 'Учебные группы',
    fields: [
      str('specialty', { required: true }),
      int('index', { default: 1 }),
      int('start_year'),
      m2o('curator', 'directus_users', { onDelete: 'SET NULL' }),
      m2o('institution', 'institutions', { required: true }),
    ],
  },
  {
    name: 'courses',
    note: 'Курсы',
    fields: [
      str('title', { required: true }),
      text('subtitle'),
      str('category'),
      str('icon', { default: 'code' }),
      choice('accent', ['aqua', 'lime', 'teal'], 'aqua'),
      str('instructor'),
      m2o('owner', 'directus_users', { required: true }),
      m2o('institution', 'institutions', { required: true }),
      choice('status', ['draft', 'published'], 'draft'),
      int('total_hours', { default: 0 }),
      file('thumbnail'),
    ],
  },
  {
    name: 'sections',
    note: 'Разделы курса',
    fields: [
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      str('title', { required: true }),
      int('order', { default: 0 }),
    ],
  },
  {
    name: 'lessons',
    note: 'Уроки',
    fields: [
      m2o('section', 'sections', { required: true, onDelete: 'CASCADE' }),
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      str('title', { required: true }),
      choice('type', ['lecture', 'video', 'practice', 'quiz', 'assignment'], 'lecture'),
      json('content'),
      num('duration_hours', { default: 1 }),
      int('xp', { default: 40 }),
      int('order', { default: 0 }),
      bool('open', false, { note: 'Урок открыт для студентов' }),
      bool('submission', false, { note: 'Требует сдачи работы' }),
    ],
  },
  {
    name: 'enrollments',
    note: 'Записи на курсы',
    unique: ['student', 'course'],
    fields: [
      m2o('student', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      created('enrolled_at'),
      int('progress_percent', { default: 0, note: 'Только сервер' }),
      ts('completed_at'),
    ],
  },
  {
    name: 'session_progress',
    note: 'Прогресс по урокам',
    unique: ['student', 'lesson'],
    fields: [
      m2o('student', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      m2o('lesson', 'lessons', { required: true, onDelete: 'CASCADE' }),
      bool('completed', false),
      ts('completed_at'),
      int('xp_earned', { default: 0, note: 'Только сервер' }),
    ],
  },
  {
    name: 'comments',
    note: 'Комментарии к курсу',
    fields: [
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      m2o('author', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      text('text', { required: true }),
      created(),
    ],
  },
  {
    name: 'submissions',
    note: 'Сданные работы',
    fields: [
      m2o('student', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      m2o('lesson', 'lessons', { required: true, onDelete: 'CASCADE' }),
      text('text'),
      choice('status', ['submitted', 'graded'], 'submitted'),
      int('grade', { note: '2–5 или баллы; только преподаватель/сервер' }),
      text('feedback'),
      created('submitted_at'),
      ts('graded_at'),
      bool('retry', false, { note: 'Разрешена пересдача' }),
    ],
  },
  {
    name: 'quizzes',
    note: 'Тесты',
    fields: [
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      m2o('lesson', 'lessons', { onDelete: 'SET NULL' }),
      m2o('author', 'directus_users', { required: true }),
      m2o('institution', 'institutions', { required: true }),
      str('title', { required: true }),
      text('description'),
      int('time_limit', { default: 0, note: 'минут, 0 = без ограничения' }),
      int('pass_score', { default: 50 }),
      int('reward_coins', { default: 0 }),
      int('reward_xp', { default: 0 }),
      bool('published', false),
      created(),
    ],
  },
  {
    name: 'quiz_questions',
    note: 'Вопросы тестов',
    fields: [
      m2o('quiz', 'quizzes', { required: true, onDelete: 'CASCADE' }),
      text('text', { required: true }),
      choice('type', ['single', 'multi', 'text'], 'single'),
      json('options'),
      json('correct', { note: 'Правильные ответы — студенту недоступны' }),
      int('points', { default: 1 }),
      int('order', { default: 0 }),
    ],
  },
  {
    name: 'quiz_attempts',
    note: 'Попытки прохождения тестов',
    fields: [
      m2o('quiz', 'quizzes', { required: true, onDelete: 'CASCADE' }),
      m2o('student', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      json('answers'),
      int('score', { default: 0, note: 'Только сервер' }),
      bool('passed', false, { note: 'Только сервер' }),
      created(),
    ],
  },
  {
    name: 'attendance',
    note: 'Посещаемость',
    unique: ['lesson', 'student'],
    fields: [
      m2o('course', 'courses', { required: true, onDelete: 'CASCADE' }),
      m2o('lesson', 'lessons', { required: true, onDelete: 'CASCADE' }),
      m2o('student', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      choice('status', ['present', 'absent', 'late', 'excused'], 'present'),
      created(),
    ],
  },
  {
    name: 'board_tasks',
    note: 'Доска заданий',
    fields: [
      m2o('author', 'directus_users', { required: true }),
      str('title', { required: true }),
      text('description'),
      choice('target', ['all', 'group'], 'all'),
      m2o('group', 'groups', { onDelete: 'SET NULL' }),
      int('reward_coins', { default: 0 }),
      int('reward_xp', { default: 0 }),
      m2o('institution', 'institutions', { required: true }),
      created(),
    ],
  },
  {
    name: 'board_completions',
    note: 'Выполнение заданий с доски',
    unique: ['task', 'student'],
    fields: [
      m2o('task', 'board_tasks', { required: true, onDelete: 'CASCADE' }),
      m2o('student', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      choice('status', ['submitted', 'approved', 'rejected', 'declined'], 'submitted'),
      created(),
    ],
  },
  {
    name: 'leaderboard',
    note: 'Рейтинг (пишет сервер)',
    unique: ['user'],
    fields: [
      m2o('user', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      str('name'),
      int('xp', { default: 0 }),
      int('level', { default: 1 }),
      str('rank', { default: 'F' }),
      m2o('institution', 'institutions', { onDelete: 'SET NULL' }),
      m2o('group', 'groups', { onDelete: 'SET NULL' }),
    ],
  },
  {
    name: 'notifications',
    note: 'Уведомления (создаёт сервер)',
    fields: [
      m2o('user', 'directus_users', { required: true, onDelete: 'CASCADE' }),
      choice('kind', ['grade', 'board', 'quiz', 'role', 'system'], 'system'),
      str('title', { required: true }),
      text('text'),
      str('link'),
      bool('read', false),
      created(),
    ],
  },
  {
    name: 'site_stats',
    note: 'Публичная витрина для главной (пересчитывает сервер)',
    singleton: true,
    fields: [
      int('courses', { default: 0 }),
      int('students', { default: 0 }),
      int('hours', { default: 0 }),
      ts('updated_at'),
    ],
  },
  {
    name: 'audit_logs',
    note: 'Журнал аудита (пишет сервер)',
    fields: [
      m2o('actor', 'directus_users', { onDelete: 'SET NULL' }),
      str('action', { required: true }),
      str('target'),
      json('meta'),
      m2o('institution', 'institutions', { onDelete: 'SET NULL' }),
      created(),
    ],
  },
  {
    name: 'qa_reports',
    note: 'Отчёты QA-чек-листа',
    fields: [
      m2o('reporter', 'directus_users', { onDelete: 'SET NULL' }),
      str('name'),
      str('role'),
      int('score', { default: 0 }),
      int('problems', { default: 0 }),
      json('payload'),
      created(),
    ],
  },
  {
    name: 'qa_screenshots',
    note: 'Скриншоты QA',
    fields: [
      m2o('report', 'qa_reports', { required: true, onDelete: 'CASCADE' }),
      str('item'),
      file('image'),
      created(),
    ],
  },
]

/** Файлы сдач — связь многие-ко-многим submissions ⟷ directus_files */
export const SUBMISSION_FILES = {
  junction: 'submissions_files',
  owner: 'submissions',
  alias: 'files',
}

/** Тестовые данные */
export const SEED_INSTITUTIONS = [
  { name: 'Белгородский Индустриальный Колледж', short_name: 'БИК', default_accent: 'aqua' },
]
