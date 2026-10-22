// fix-directus-final.mjs
// Финальная починка Directus после миграции схемы.
//
// Что делает:
// 1. Проверяет подключение и права токена.
// 2. Удаляет дубли в attendance (lesson + student).
// 3. Тестирует deep fetch для ключевых коллекций.
// 4. Выводит честный отчёт.
//
// Запуск:
//   node scripts\fix-directus-final.mjs
//
// Токен берётся из .env.audit (DIRECTUS_STATIC_TOKEN).

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Загрузка env ─────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  const path = resolve(process.cwd(), '.env.audit');
  if (!existsSync(path)) return env;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const fe = loadEnv();
const URL = (
  process.env.DIRECTUS_URL ||
  fe.DIRECTUS_URL ||
  fe.VITE_DIRECTUS_URL ||
  'https://api.protocol-lms.ru'
).replace(/\/$/, '');

const TOKEN =
  process.env.DIRECTUS_STATIC_TOKEN ||
  fe.DIRECTUS_STATIC_TOKEN ||
  fe.VITE_DIRECTUS_STATIC_TOKEN ||
  '';

if (!TOKEN) {
  console.error('❌ Нет токена. Укажи DIRECTUS_STATIC_TOKEN в .env.audit');
  process.exit(1);
}

const H = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: H };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${URL}${path}`, opts);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, text, json };
}

function norm(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v.id != null ? String(v.id) : JSON.stringify(v);
  return String(v);
}

// ─── Шаг 0: проверка подключения ──────────────────────────────────────────────
console.log('');
console.log('🔧 PROTOCOL-LMS: финальная починка Directus');
console.log(`   URL: ${URL}`);
console.log('');

const health = await api('GET', '/server/health');
if (!health.ok) {
  console.error(`❌ Не удалось подключиться: ${health.status}`);
  console.error(health.text.slice(0, 300));
  process.exit(1);
}
console.log('✅ Directus доступен');

// Проверка прав токена
const me = await api('GET', '/users/me');
if (!me.ok) {
  console.error(`❌ Токен не валиден: ${me.status}`);
  console.error(me.text.slice(0, 300));
  process.exit(1);
}
console.log(`✅ Токен валиден (${me.json?.data?.email || me.json?.data?.role || 'user'})`);
console.log('');

// ─── Шаг 1: удаление дублей в attendance ──────────────────────────────────────
console.log('━━━ Шаг 1: Очистка дублей attendance ━━━');

const att = await api('GET', '/items/attendance?limit=-1&fields=id,lesson,student,created,status&sort=id');
if (!att.ok) {
  console.error(`❌ Не удалось прочитать attendance: ${att.status}`);
  console.error(att.text.slice(0, 300));
} else {
  const rows = att.json?.data || [];
  console.log(`   Всего записей: ${rows.length}`);

  const groups = new Map();
  for (const r of rows) {
    const key = `${norm(r.lesson)}|${norm(r.student)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  const toDelete = [];
  for (const [key, list] of groups) {
    if (list.length <= 1) continue;
    // Сортируем: сначала по created, потом по id. Оставляем самую раннюю.
    list.sort((a, b) => {
      const ta = a.created ? new Date(a.created).getTime() : 0;
      const tb = b.created ? new Date(b.created).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return Number(a.id) - Number(b.id);
    });
    const keep = list[0];
    const dups = list.slice(1);
    console.log(`   Дубль ${key}: оставляю id=${keep.id}, удаляю [${dups.map(d => d.id).join(', ')}]`);
    for (const d of dups) toDelete.push(d.id);
  }

  if (toDelete.length === 0) {
    console.log('   ✅ Дублей нет');
  } else {
    console.log(`   Удаляю ${toDelete.length} дублей...`);
    // Directus поддерживает batch delete
    const del = await api('DELETE', '/items/attendance', toDelete);
    if (del.ok || del.status === 204) {
      console.log(`   ✅ Удалено: ${toDelete.length}`);
    } else {
      console.error(`   ❌ Ошибка удаления: ${del.status}`);
      console.error(del.text.slice(0, 300));
      // fallback: удаляем по одному
      for (const id of toDelete) {
        const r = await api('DELETE', `/items/attendance/${id}`);
        console.log(`      id=${id}: ${r.ok ? 'OK' : r.status}`);
      }
    }
  }
}
console.log('');

// ─── Шаг 2: тест deep fetch (проверка связей) ────────────────────────────────
console.log('━━━ Шаг 2: Проверка связей через deep fetch ━━━');

const DEEP_TESTS = [
  {
    name: 'users → institution, group',
    collection: 'users',
    fields: 'id,full_name,institution.short_name,group.specialty',
    expect: ['institution', 'group'],
  },
  {
    name: 'courses → owner, institution',
    collection: 'courses',
    fields: 'id,title,owner.full_name,institution.short_name',
    expect: ['owner', 'institution'],
  },
  {
    name: 'lessons → section, course',
    collection: 'lessons',
    fields: 'id,title,section.title,course.title',
    expect: ['section', 'course'],
  },
  {
    name: 'enrollments → student, course',
    collection: 'enrollments',
    fields: 'id,student.full_name,course.title',
    expect: ['student', 'course'],
  },
  {
    name: 'submissions → student, lesson',
    collection: 'submissions',
    fields: 'id,student.full_name,lesson.title',
    expect: ['student', 'lesson'],
  },
  {
    name: 'quizzes → author, course',
    collection: 'quizzes',
    fields: 'id,title,author.full_name,course.title',
    expect: ['author', 'course'],
  },
  {
    name: 'attendance → student, lesson',
    collection: 'attendance',
    fields: 'id,student.full_name,lesson.title,status',
    expect: ['student', 'lesson'],
  },
  {
    name: 'board_tasks → author, institution',
    collection: 'board_tasks',
    fields: 'id,title,author.full_name,institution.short_name',
    expect: ['author', 'institution'],
  },
  {
    name: 'leaderboard → user, institution, group',
    collection: 'leaderboard',
    fields: 'id,user.full_name,institution.short_name,group.specialty',
    expect: ['user', 'institution', 'group'],
  },
  {
    name: 'qa_reports → reporter',
    collection: 'qa_reports',
    fields: 'id,reporter.full_name',
    expect: ['reporter'],
  },
];

let deepOk = 0;
let deepWarn = 0;
let deepErr = 0;

for (const t of DEEP_TESTS) {
  const r = await api('GET', `/items/${t.collection}?limit=1&fields=${t.fields}`);

  if (!r.ok) {
    if (r.status === 403) {
      console.log(`   ⚠️  ${t.name}: нет прав на чтение (403)`);
      deepWarn++;
    } else {
      console.error(`   ❌ ${t.name}: ${r.status} ${r.text.slice(0, 100)}`);
      deepErr++;
    }
    continue;
  }

  const rows = r.json?.data || [];
  if (rows.length === 0) {
    console.log(`   ⏭  ${t.name}: коллекция пуста, связь не проверить`);
    deepWarn++;
    continue;
  }

  const row = rows[0];
  const resolved = [];
  const unresolved = [];

  for (const field of t.expect) {
    const v = row[field];
    if (v == null) {
      unresolved.push(`${field}=null`);
    } else if (typeof v === 'object' && Object.keys(v).length > 0) {
      resolved.push(`${field}=✓`);
    } else if (typeof v === 'number' || typeof v === 'string') {
      // Поле вернуло ID вместо объекта — связь не настроена
      unresolved.push(`${field}=${v} (ID, не объект)`);
    } else {
      unresolved.push(`${field}=?`);
    }
  }

  if (unresolved.length === 0) {
    console.log(`   ✅ ${t.name}: связи работают (${resolved.join(', ')})`);
    deepOk++;
  } else {
    console.error(`   ❌ ${t.name}: не резолвятся → ${unresolved.join(', ')}`);
    deepErr++;
  }
}

console.log('');
console.log(`   Итог deep fetch: ✅ ${deepOk}, ⚠️ ${deepWarn}, ❌ ${deepErr}`);
console.log('');

// ─── Шаг 3: проверка directus_users (для прод-логина) ────────────────────────
console.log('━━━ Шаг 3: Проверка directus_users ━━━');

const duUsers = await api('GET', '/users?limit=-1&fields=id,email');
const duCustom = await api('GET', '/items/users?limit=-1&fields=id,email');

if (!duUsers.ok) {
  if (duUsers.status === 403) {
    console.log('   ⚠️  Нет прав на чтение directus_users (403)');
    console.log('      Для прод-логина нужны права: Settings → Access Control → твоя роль → directus_users → Read');
  } else {
    console.error(`   ❌ ${duUsers.status}: ${duUsers.text.slice(0, 200)}`);
  }
} else if (!duCustom.ok) {
  console.error(`   ❌ Не удалось прочитать кастомных users: ${duCustom.status}`);
} else {
  const sysEmails = new Set((duUsers.json?.data || []).map(u => String(u.email || '').toLowerCase()).filter(Boolean));
  const customEmails = (duCustom.json?.data || []).map(u => String(u.email || '').toLowerCase()).filter(Boolean);

  const missing = customEmails.filter(e => !sysEmails.has(e));

  console.log(`   directus_users (системные): ${sysEmails.size}`);
  console.log(`   users (кастомные): ${customEmails.length}`);

  if (missing.length === 0) {
    console.log('   ✅ Все кастомные пользователи имеют системные аккаунты — прод-логин будет работать');
  } else {
    console.log(`   ⚠️  ${missing.length} кастомных пользователей без системного аккаунта:`);
    for (const e of missing.slice(0, 5)) console.log(`      - ${e}`);
    if (missing.length > 5) console.log(`      ... и ещё ${missing.length - 5}`);
    console.log('');
    console.log('   Для прод-логина создай directus_users с теми же email:');
    console.log('   Settings → User Directory → + → email + password + role');
  }
}
console.log('');

// ─── Итог ─────────────────────────────────────────────────────────────────────
console.log('━━━ Итог ━━━');
if (deepErr === 0) {
  console.log('✅ Схема Directus работает корректно.');
  console.log('');
  console.log('Следующие шаги:');
  console.log('  1. Создай уникальные индексы (см. SQL ниже)');
  console.log('  2. Перенеси данные из PocketBase (если ещё не перенесены)');
  console.log('  3. Создай directus_users для продакшен-входа (если нужно)');
  console.log('  4. Собери фронт: npm run build');
  console.log('  5. Задеплой: scp -r dist root@159.194.237.33:/var/www/protocol-lms/dist');
} else {
  console.log(`❌ Есть ${deepErr} проблем со связями. Скинь вывод — разберу каждую.`);
}
console.log('');
console.log('SQL для уникальных индексов (выполни в БД Directus):');
console.log('');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_institutions_short_name ON institutions (short_name);');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_student_id ON users (student_id);');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_sc ON enrollments (student, course);');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_session_progress_sl ON session_progress (student, lesson);');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_sl ON submissions (student, lesson);');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_board_completions_ts ON board_completions (task, student);');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_ls ON attendance (lesson, student);');
console.log('  CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_u ON leaderboard ("user");');
console.log('');