// fix-relations.mjs
const DIRECTUS_URL = 'https://api.protocol-lms.ru';
const ADMIN_TOKEN = 'Ks-y--5Q8C9mBwYzMWVrXRpcXJoWDMt0'; // Токен суперадмина Directus

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

// Маппинг всех связей на основе вашего SCHEMA.md (PocketBase -> Directus)
const relations = [
  // users
  { collection: 'users', field: 'institution', related_collection: 'institutions', on_delete: 'SET NULL' },
  { collection: 'users', field: 'group', related_collection: 'groups', on_delete: 'SET NULL' },
  // courses
  { collection: 'courses', field: 'owner', related_collection: 'users', on_delete: 'SET NULL' },
  { collection: 'courses', field: 'institution', related_collection: 'institutions', on_delete: 'SET NULL' },
  // sections & lessons
  { collection: 'sections', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  { collection: 'lessons', field: 'section', related_collection: 'sections', on_delete: 'CASCADE' },
  { collection: 'lessons', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  // enrollments & progress
  { collection: 'enrollments', field: 'student', related_collection: 'users', on_delete: 'CASCADE' },
  { collection: 'enrollments', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  { collection: 'session_progress', field: 'student', related_collection: 'users', on_delete: 'CASCADE' },
  { collection: 'session_progress', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  { collection: 'session_progress', field: 'lesson', related_collection: 'lessons', on_delete: 'CASCADE' },
  // comments & submissions
  { collection: 'comments', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  { collection: 'comments', field: 'author', related_collection: 'users', on_delete: 'CASCADE' },
  { collection: 'submissions', field: 'student', related_collection: 'users', on_delete: 'CASCADE' },
  { collection: 'submissions', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  { collection: 'submissions', field: 'lesson', related_collection: 'lessons', on_delete: 'CASCADE' },
  // groups
  { collection: 'groups', field: 'curator', related_collection: 'users', on_delete: 'SET NULL' },
  { collection: 'groups', field: 'institution', related_collection: 'institutions', on_delete: 'SET NULL' },
  // notifications & board
  { collection: 'notifications', field: 'user', related_collection: 'users', on_delete: 'CASCADE' },
  { collection: 'board_tasks', field: 'author', related_collection: 'users', on_delete: 'SET NULL' },
  { collection: 'board_tasks', field: 'group', related_collection: 'groups', on_delete: 'SET NULL' },
  { collection: 'board_tasks', field: 'institution', related_collection: 'institutions', on_delete: 'SET NULL' },
  { collection: 'board_completions', field: 'task', related_collection: 'board_tasks', on_delete: 'CASCADE' },
  { collection: 'board_completions', field: 'student', related_collection: 'users', on_delete: 'CASCADE' },
  // attendance
  { collection: 'attendance', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  { collection: 'attendance', field: 'lesson', related_collection: 'lessons', on_delete: 'CASCADE' },
  { collection: 'attendance', field: 'student', related_collection: 'users', on_delete: 'CASCADE' },
  // quizzes
  { collection: 'quizzes', field: 'course', related_collection: 'courses', on_delete: 'CASCADE' },
  { collection: 'quizzes', field: 'lesson', related_collection: 'lessons', on_delete: 'SET NULL' },
  { collection: 'quizzes', field: 'author', related_collection: 'users', on_delete: 'SET NULL' },
  { collection: 'quizzes', field: 'institution', related_collection: 'institutions', on_delete: 'SET NULL' },
  { collection: 'quiz_questions', field: 'quiz', related_collection: 'quizzes', on_delete: 'CASCADE' },
  { collection: 'quiz_attempts', field: 'quiz', related_collection: 'quizzes', on_delete: 'CASCADE' },
  { collection: 'quiz_attempts', field: 'student', related_collection: 'users', on_delete: 'CASCADE' },
  // leaderboard & qa
  { collection: 'leaderboard', field: 'user', related_collection: 'users', on_delete: 'CASCADE' },
  { collection: 'leaderboard', field: 'institution', related_collection: 'institutions', on_delete: 'SET NULL' },
  { collection: 'leaderboard', field: 'group', related_collection: 'groups', on_delete: 'SET NULL' },
  { collection: 'qa_reports', field: 'reporter', related_collection: 'users', on_delete: 'CASCADE' },
  { collection: 'qa_screenshots', field: 'report', related_collection: 'qa_reports', on_delete: 'CASCADE' },
  { collection: 'qa_screenshots', field: 'image', related_collection: 'directus_files', on_delete: 'SET NULL' },
];

async function ensureRelation(rel) {
  const url = `${DIRECTUS_URL}/relations/${rel.collection}/${rel.field}`;
  
  try {
    const checkRes = await fetch(url, { headers });
    if (checkRes.ok) {
      // Связь есть, но обновим правило удаления (on_delete) для надежности
      await fetch(url, {
        method: 'PATCH', headers,
        body: JSON.stringify({ schema: { on_delete: rel.on_delete } })
      });
      console.log(`[OK] ${rel.collection}.${rel.field} -> ${rel.related_collection}`);
      return;
    }
  } catch (e) {}

  const payload = {
    collection: rel.collection,
    field: rel.field,
    related_collection: rel.related_collection,
    schema: { on_delete: rel.on_delete }
  };

  const res = await fetch(`${DIRECTUS_URL}/relations`, {
    method: 'POST', headers, body: JSON.stringify(payload)
  });

  if (res.ok || res.status === 204) {
    console.log(`[+] Создано: ${rel.collection}.${rel.field} -> ${rel.related_collection}`);
  } else {
    const err = await res.text();
    console.error(`[!] Ошибка ${rel.collection}.${rel.field}: ${err}`);
  }
}

async function run() {
  console.log('🚀 Начинаем починку связей в Directus...');
  for (const rel of relations) {
    await ensureRelation(rel);
  }
  console.log('✅ Готово! Связи зарегистрированы. Админка и API теперь понимают их как m2o.');
}

run();