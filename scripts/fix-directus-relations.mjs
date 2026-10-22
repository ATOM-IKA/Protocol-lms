const DIRECTUS_URL = 'https://api.protocol-lms.ru';
const ADMIN_TOKEN = 'Ks-y--5Q8C9mBwYzMWVrXRpcXJoWDMt0';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json',
};

// [коллекция, поле, целевая коллекция]
// Взято из аудита: все 41 поле, которые помечены как "не выглядит как relation"
const RELATIONS = [
  ['users', 'institution', 'institutions'],
  ['users', 'group', 'groups'],
  ['courses', 'owner', 'users'],
  ['courses', 'institution', 'institutions'],
  ['sections', 'course', 'courses'],
  ['lessons', 'section', 'sections'],
  ['lessons', 'course', 'courses'],
  ['enrollments', 'student', 'users'],
  ['enrollments', 'course', 'courses'],
  ['session_progress', 'student', 'users'],
  ['session_progress', 'course', 'courses'],
  ['session_progress', 'lesson', 'lessons'],
  ['comments', 'course', 'courses'],
  ['comments', 'author', 'users'],
  ['submissions', 'student', 'users'],
  ['submissions', 'course', 'courses'],
  ['submissions', 'lesson', 'lessons'],
  ['groups', 'curator', 'users'],
  ['groups', 'institution', 'institutions'],
  ['notifications', 'user', 'users'],
  ['board_tasks', 'author', 'users'],
  ['board_tasks', 'group', 'groups'],
  ['board_tasks', 'institution', 'institutions'],
  ['board_completions', 'task', 'board_tasks'],
  ['board_completions', 'student', 'users'],
  ['attendance', 'course', 'courses'],
  ['attendance', 'lesson', 'lessons'],
  ['attendance', 'student', 'users'],
  ['quizzes', 'course', 'courses'],
  ['quizzes', 'lesson', 'lessons'],
  ['quizzes', 'author', 'users'],
  ['quizzes', 'institution', 'institutions'],
  ['quiz_questions', 'quiz', 'quizzes'],
  ['quiz_attempts', 'quiz', 'quizzes'],
  ['quiz_attempts', 'student', 'users'],
  ['leaderboard', 'user', 'users'],
  ['leaderboard', 'institution', 'institutions'],
  ['leaderboard', 'group', 'groups'],
  ['qa_reports', 'reporter', 'users'],
  ['qa_screenshots', 'report', 'qa_reports'],
  ['qa_screenshots', 'image', 'directus_files'],
];

async function main() {
  let created = 0;
  let skipped = 0;
  let errors = 0;

  console.log('Directus fix-relations: начинаю...\n');

  for (const [collection, field, related] of RELATIONS) {
    try {
      // 1. Проверяем, существует ли связь уже
      const checkRes = await fetch(
        `${DIRECTUS_URL}/relations/${collection}/${field}`,
        { headers }
      );

      if (checkRes.ok) {
        console.log(`[SKIP]  ${collection}.${field} -> ${related} (уже есть)`);
        skipped++;
        continue;
      }

      // 2. Создаём связь
      const createRes = await fetch(`${DIRECTUS_URL}/relations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          collection,
          field,
          related_collection: related,
          schema: { on_delete: 'SET NULL' },
          meta: {},
        }),
      });

      if (!createRes.ok) {
        const text = await createRes.text();
        console.error(`[ERROR] ${collection}.${field}: HTTP ${createRes.status} — ${text}`);
        errors++;
        continue;
      }

      console.log(`[OK]    ${collection}.${field} -> ${related}`);
      created++;
    } catch (e) {
      console.error(`[ERROR] ${collection}.${field}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nИтого: создано ${created}, пропущено ${skipped}, ошибок ${errors}`);

  if (errors > 0) {
    console.log('\nЕсть ошибки. Скинь мне вывод — разберём каждую.');
  } else {
    console.log('\nВсе связи проставлены. Запусти аудит повторно.');
  }
}

main();