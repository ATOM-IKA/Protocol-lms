#!/usr/bin/env node
/**
 * PROTOCOL-LMS — аудит миграции PocketBase -> Directus.
 *
 * Проверяет:
 * - доступность PocketBase и Directus;
 * - наличие ожидаемых коллекций;
 * - наличие критичных полей;
 * - признаки relational-полей в Directus;
 * - количество записей в PocketBase и Directus;
 * - дубли по уникальным ключам;
 * - сиротские связи;
 * - наличие пользователей для авторизации в directus_users.
 *
 * Запуск:
 *   node scripts/audit-pb-directus.mjs --env .env.audit --out protocol-directus-audit.md
 *
 * Флаги:
 *   --fast          пропустить тяжёлые проверки дублей и сирот
 *   --env file      путь к env-файлу
 *   --out file      куда сохранить отчёт
 */

import fs from 'node:fs';
import process from 'node:process';

const args = process.argv.slice(2);

function arg(name, def) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}

function flag(name) {
  return args.includes(name);
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2] || '';
    val = val.replace(/^['"]|['"]$/g, '');
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnv(arg('--env', '.env'));

const env = (k, d = '') => process.env[k] ?? d;

const PB_URL = env('PB_URL').replace(/\/$/, '');
const PB_TOKEN = env('PB_TOKEN');
const PB_EMAIL = env('PB_SUPERUSER_EMAIL') || env('PB_EMAIL');
const PB_PASSWORD = env('PB_SUPERUSER_PASSWORD') || env('PB_PASSWORD');

const DX_URL = (env('DIRECTUS_URL') || env('VITE_DIRECTUS_URL')).replace(/\/$/, '');
const DX_STATIC = env('DIRECTUS_STATIC_TOKEN') || env('VITE_DIRECTUS_STATIC_TOKEN');
const DX_EMAIL = env('DIRECTUS_EMAIL');
const DX_PASSWORD = env('DIRECTUS_PASSWORD');

const OUT = arg('--out', 'protocol-directus-audit.md');
const FAST = flag('--fast');

/**
 * Ожидаемая схема по миграциям и хукам PocketBase.
 * Это канон для текущей версии кода.
 */
const EXPECTED = {
  institutions: {
    fields: ['id', 'name', 'short_name', 'logo', 'default_accent'],
    unique: [['short_name']],
    rel: [],
    relMap: {},
  },

  users: {
    fields: [
      'id',
      'email',
      'full_name',
      'student_id',
      'callsign',
      'role',
      'institution',
      'avatar',
      'xp',
      'level',
      'rank',
      'coins',
      'group',
    ],
    unique: [['student_id'], ['email']],
    rel: ['institution', 'group'],
    relMap: {
      institution: 'institutions',
      group: 'groups',
    },
  },

  courses: {
    fields: [
      'id',
      'title',
      'subtitle',
      'category',
      'icon',
      'accent',
      'instructor',
      'owner',
      'institution',
      'status',
      'total_hours',
      'thumbnail',
    ],
    unique: [],
    rel: ['owner', 'institution'],
    relMap: {
      owner: 'users',
      institution: 'institutions',
    },
  },

  sections: {
    fields: ['id', 'course', 'title', 'order'],
    unique: [],
    rel: ['course'],
    relMap: {
      course: 'courses',
    },
  },

  lessons: {
    fields: [
      'id',
      'section',
      'course',
      'title',
      'type',
      'content',
      'duration_hours',
      'xp',
      'order',
      'open',
      'submission',
    ],
    unique: [],
    rel: ['section', 'course'],
    relMap: {
      section: 'sections',
      course: 'courses',
    },
  },

  enrollments: {
    fields: ['id', 'student', 'course', 'enrolled_at', 'progress_percent', 'completed_at'],
    unique: [['student', 'course']],
    rel: ['student', 'course'],
    relMap: {
      student: 'users',
      course: 'courses',
    },
  },

  session_progress: {
    fields: ['id', 'student', 'course', 'lesson', 'completed', 'completed_at', 'xp_earned'],
    unique: [['student', 'lesson']],
    rel: ['student', 'course', 'lesson'],
    relMap: {
      student: 'users',
      course: 'courses',
      lesson: 'lessons',
    },
  },

  comments: {
    fields: ['id', 'course', 'author', 'text'],
    unique: [],
    rel: ['course', 'author'],
    relMap: {
      course: 'courses',
      author: 'users',
    },
  },

  audit_logs: {
    fields: ['id', 'user', 'action', 'target', 'meta', 'created'],
    unique: [],
    rel: [],
    relMap: {},
  },

  submissions: {
    fields: [
      'id',
      'student',
      'course',
      'lesson',
      'text',
      'files',
      'status',
      'grade',
      'feedback',
      'retry',
      'submitted_at',
      'graded_at',
    ],
    unique: [['student', 'lesson']],
    rel: ['student', 'course', 'lesson'],
    relMap: {
      student: 'users',
      course: 'courses',
      lesson: 'lessons',
    },
  },

  groups: {
    fields: ['id', 'specialty', 'index', 'start_year', 'curator', 'institution'],
    unique: [],
    rel: ['curator', 'institution'],
    relMap: {
      curator: 'users',
      institution: 'institutions',
    },
  },

  notifications: {
    fields: ['id', 'user', 'kind', 'title', 'text', 'link', 'read', 'created'],
    unique: [],
    rel: ['user'],
    relMap: {
      user: 'users',
    },
  },

  board_tasks: {
    fields: [
      'id',
      'author',
      'title',
      'description',
      'target',
      'group',
      'reward_coins',
      'reward_xp',
      'institution',
      'created',
    ],
    unique: [],
    rel: ['author', 'group', 'institution'],
    relMap: {
      author: 'users',
      group: 'groups',
      institution: 'institutions',
    },
  },

  board_completions: {
    fields: ['id', 'task', 'student', 'status', 'created'],
    unique: [['task', 'student']],
    rel: ['task', 'student'],
    relMap: {
      task: 'board_tasks',
      student: 'users',
    },
  },

  attendance: {
    fields: ['id', 'course', 'lesson', 'student', 'status', 'created'],
    unique: [['lesson', 'student']],
    rel: ['course', 'lesson', 'student'],
    relMap: {
      course: 'courses',
      lesson: 'lessons',
      student: 'users',
    },
  },

  quizzes: {
    fields: [
      'id',
      'course',
      'lesson',
      'author',
      'institution',
      'title',
      'description',
      'time_limit',
      'pass_score',
      'reward_coins',
      'reward_xp',
      'published',
      'created',
    ],
    unique: [],
    rel: ['course', 'lesson', 'author', 'institution'],
    relMap: {
      course: 'courses',
      lesson: 'lessons',
      author: 'users',
      institution: 'institutions',
    },
  },

  quiz_questions: {
    fields: ['id', 'quiz', 'text', 'type', 'options', 'correct', 'points', 'order'],
    unique: [],
    rel: ['quiz'],
    relMap: {
      quiz: 'quizzes',
    },
  },

  quiz_attempts: {
    fields: ['id', 'quiz', 'student', 'answers', 'score', 'passed', 'created'],
    unique: [],
    rel: ['quiz', 'student'],
    relMap: {
      quiz: 'quizzes',
      student: 'users',
    },
  },

  leaderboard: {
    fields: ['id', 'user', 'name', 'xp', 'level', 'rank', 'institution', 'group'],
    unique: [['user']],
    rel: ['user', 'institution', 'group'],
    relMap: {
      user: 'users',
      institution: 'institutions',
      group: 'groups',
    },
  },

  qa_reports: {
    fields: ['id', 'reporter', 'name', 'role', 'score', 'problems', 'payload', 'created'],
    unique: [],
    rel: ['reporter'],
    relMap: {
      reporter: 'users',
    },
  },

  qa_screenshots: {
    fields: ['id', 'report', 'item', 'image', 'created'],
    unique: [],
    rel: ['report', 'image'],
    relMap: {
      report: 'qa_reports',
      image: 'directus_files',
    },
  },
};

async function jfetch(url, opts = {}) {
  const res = await fetch(url, { redirect: 'follow', ...opts });
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = typeof data === 'string' ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
    throw new Error(`${res.status} ${url} ${msg}`);
  }

  return data;
}

async function getPbToken() {
  if (!PB_URL) return null;
  if (PB_TOKEN) return PB_TOKEN;
  if (!PB_EMAIL || !PB_PASSWORD) return null;

  const body = JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD });
  const headers = { 'Content-Type': 'application/json' };

  try {
    const d = await jfetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers,
      body,
    });
    return d.token;
  } catch {
    // ignore
  }

  try {
    const d = await jfetch(`${PB_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers,
      body,
    });
    return d.token;
  } catch {
    return null;
  }
}

async function pbCount(col, token) {
  const headers = token ? { Authorization: token } : {};
  const d = await jfetch(`${PB_URL}/api/collections/${col}/records?page=1&perPage=1`, { headers });
  return d.totalItems ?? 0;
}

async function getDxToken() {
  if (!DX_URL) {
    throw new Error('DIRECTUS_URL или VITE_DIRECTUS_URL не задан.');
  }

  if (DX_STATIC) return DX_STATIC;

  if (DX_EMAIL && DX_PASSWORD) {
    const d = await jfetch(`${DX_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DX_EMAIL, password: DX_PASSWORD }),
    });
    return d.data.access_token;
  }

  throw new Error('Нужен DIRECTUS_STATIC_TOKEN или DIRECTUS_EMAIL + DIRECTUS_PASSWORD.');
}

async function dxCollections(headers) {
  const d = await jfetch(`${DX_URL}/collections?limit=-1`, { headers });
  return (d.data || []).map((c) => c.collection);
}

async function dxFields(headers, col) {
  const d = await jfetch(`${DX_URL}/fields/${col}`, { headers });
  const out = {};
  for (const f of d.data || []) out[f.field] = f;
  return out;
}

async function dxCount(headers, col) {
  try {
    const d = await jfetch(`${DX_URL}/items/${col}?limit=1&fields=id&meta=filter_count&sort=id`, { headers });
    if (d.meta && d.meta.filter_count != null) return Number(d.meta.filter_count);
  } catch (e) {
    if (/404/.test(e.message)) throw e;
  }

  const d = await jfetch(`${DX_URL}/items/${col}?aggregate%5Bcount%5D=id`, { headers });
  const row = Array.isArray(d.data) ? d.data[0] : d.data;
  return Number(row?.count ?? 0);
}

async function dxAll(headers, col, fields) {
  const out = [];
  const limit = 500;
  let page = 1;

  while (true) {
    const url = `${DX_URL}/items/${col}?limit=${limit}&page=${page}&sort=id&fields=${fields.join(',')}`;
    const d = await jfetch(url, { headers });
    const rows = d.data || [];
    out.push(...rows);

    if (rows.length < limit) break;
    page += 1;

    if (page > 5000) {
      throw new Error(`Слишком много страниц при чтении ${col}; остановлен предохранитель.`);
    }
  }

  return out;
}

function norm(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v.id ?? JSON.stringify(v);
  return String(v);
}

function findDuplicates(rows, keys) {
  const map = new Map();
  const dups = [];

  for (const row of rows) {
    const vals = keys.map((k) => norm(row[k]));
    if (vals.some((x) => x == null)) continue;

    const key = vals.join('|');
    const n = (map.get(key) || 0) + 1;
    map.set(key, n);

    if (n === 2) dups.push(key);
  }

  return dups.slice(0, 10);
}

async function idSet(headers, col, cache) {
  if (cache.has(col)) return cache.get(col);

  const rows = await dxAll(headers, col, ['id']);
  const set = new Set(rows.map((r) => norm(r.id)));
  cache.set(col, set);

  return set;
}

function specialIncludes(field, name) {
  const special = field?.meta?.special;
  const arr = Array.isArray(special) ? special : special ? [special] : [];
  return arr.includes(name);
}

async function main() {
  const issues = [];
  const tableRows = [];

  const issue = (sev, area, msg) => {
    issues.push({ sev, area, msg });
  };

  console.log('PROTOCOL-LMS audit: PocketBase -> Directus');
  console.log('');

  if (!DX_URL) {
    throw new Error('DIRECTUS_URL не задан. Создай .env.audit и укажи адрес Directus.');
  }

  const dxToken = await getDxToken();
  const headers = { Authorization: `Bearer ${dxToken}` };

  console.log(`Directus: ${DX_URL}`);
  console.log(`PocketBase: ${PB_URL || 'не задан — проверяем только Directus'}`);
  console.log('');

  const colsArray = await dxCollections(headers);
  const cols = new Set(colsArray);

  const pbToken = await getPbToken();
  if (!pbToken && PB_URL) {
    issue('WARN', 'PocketBase', 'Не удалось получить токен суперпользователя/админа PocketBase.');
  }
  if (!PB_URL) {
    issue('WARN', 'PocketBase', 'PB_URL не задан: сравнение количества записей PB vs Directus пропущено.');
  }

  const idCache = new Map();

  for (const [col, spec] of Object.entries(EXPECTED)) {
    const row = {
      col,
      pb: '-',
      dx: '-',
      missing: [],
      relWarnings: [],
      duplicates: [],
      orphans: [],
    };

    if (!cols.has(col)) {
      issue('ERROR', 'schema', `В Directus отсутствует коллекция: ${col}`);
      tableRows.push(row);
      continue;
    }

    const fields = await dxFields(headers, col);

    for (const f of spec.fields) {
      if (!(f in fields)) {
        row.missing.push(f);
        issue('ERROR', 'schema', `В коллекции Directus ${col} отсутствует поле: ${f}`);
      }
    }

    for (const f of spec.rel || []) {
      if (!(f in fields)) continue;

      const field = fields[f];
      const isRel =
        specialIncludes(field, 'relation') ||
        specialIncludes(field, 'relations') ||
        specialIncludes(field, 'files');

      if (!isRel) {
        row.relWarnings.push(f);
        issue(
          'WARN',
          'schema',
          `Directus ${col}.${f}: поле существует, но не выглядит как relation. type=${field.type}, special=${JSON.stringify(field?.meta?.special || [])}`,
        );
      }
    }

    try {
      row.dx = await dxCount(headers, col);
    } catch (e) {
      issue('ERROR', 'directus', `Не удалось получить количество записей ${col}: ${e.message}`);
    }

    if (pbToken && PB_URL) {
      try {
        row.pb = await pbCount(col, pbToken);

        if (row.pb !== row.dx) {
          issue('ERROR', 'data', `Несовпадение количества записей: ${col} PB=${row.pb}, Directus=${row.dx}`);
        }
      } catch (e) {
        issue('WARN', 'PocketBase', `Не удалось прочитать ${col}: ${e.message}`);
      }
    }

    if (!FAST && row.dx !== '-' && Number(row.dx) > 0) {
      for (const u of spec.unique || []) {
        try {
          const rows = await dxAll(headers, col, u);
          const dups = findDuplicates(rows, u);

          if (dups.length) {
            row.duplicates.push(...dups);
            issue('ERROR', 'unique', `В Directus ${col} найдены дубли по уникальному ключу ${u.join('+')}: ${dups.join('; ')}`);
          }
        } catch (e) {
          issue('WARN', 'unique', `Не удалось проверить уникальность ${col}.${u.join('+')}: ${e.message}`);
        }
      }

      for (const [field, target] of Object.entries(spec.relMap || {})) {
        try {
          if (!cols.has(target)) {
            issue('WARN', 'orphans', `Пропускаем сироты ${col}.${field}: целевая коллекция ${target} не найдена.`);
            continue;
          }

          const targetIds = await idSet(headers, target, idCache);
          const rows = await dxAll(headers, col, [field]);

          let missing = 0;

          for (const r of rows) {
            const val = norm(r[field]);
            if (val != null && !targetIds.has(val)) missing += 1;
          }

          if (missing > 0) {
            row.orphans.push(`${field}->${target}:${missing}`);
            issue('ERROR', 'orphans', `В Directus ${col}.${field} найдено ${missing} сиротских ссылок на ${target}.`);
          }
        } catch (e) {
          issue('WARN', 'orphans', `Не удалось проверить сироты ${col}.${field}->${target}: ${e.message}`);
        }
      }
    }

    tableRows.push(row);
  }

  if (cols.has('directus_users') && cols.has('users')) {
    try {
      const directusUsers = await dxAll(headers, 'directus_users', ['email']);
      const profileUsers = await dxAll(headers, 'users', ['email']);

      const authEmails = new Set(
        directusUsers
          .map((u) => String(u.email || '').trim().toLowerCase())
          .filter(Boolean),
      );

      const missingAuth = profileUsers.filter((u) => {
        const email = String(u.email || '').trim().toLowerCase();
        return email && !authEmails.has(email);
      }).length;

      if (missingAuth > 0) {
        issue(
          'WARN',
          'auth',
          `Для ${missingAuth} пользователей из кастомной коллекции users нет соответствующего пользователя в directus_users. Прод-логин может не работать.`,
        );
      }
    } catch (e) {
      issue('WARN', 'auth', `Не удалось проверить directus_users: ${e.message}`);
    }
  } else {
    issue('WARN', 'auth', 'Не найдены одна или обе коллекции: users / directus_users. Проверь модель авторизации.');
  }

  const errors = issues.filter((i) => i.sev === 'ERROR');
  const warns = issues.filter((i) => i.sev === 'WARN');

  let md = `# PROTOCOL-LMS — аудит PocketBase → Directus\n\n`;
  md += `Дата: ${new Date().toISOString()}\n\n`;
  md += `Directus: ${DX_URL}\n`;
  md += `PocketBase: ${PB_URL || 'не задан'}\n`;
  md += `Ошибки: ${errors.length}\n`;
  md += `Предупреждения: ${warns.length}\n\n`;

  md += `## Сводка по коллекциям\n\n`;
  md += `| Коллекция | PB записей | Directus записей | Нет полей | Relation warnings | Дубли | Сироты |\n`;
  md += `|---|---:|---:|---|---|---|---|\n`;

  for (const r of tableRows) {
    md += `| ${r.col} | ${r.pb} | ${r.dx} | ${r.missing.join(', ') || '-'} | ${r.relWarnings.join(', ') || '-'} | ${
      r.duplicates.length
    } | ${r.orphans.join(', ') || '-'} |\n`;
  }

  md += `\n## Проблемы\n\n`;

  if (!issues.length) {
    md += `Критичных проблем не найдено.\n`;
  } else {
    for (const i of issues) {
      md += `- **${i.sev}** [${i.area}] ${i.msg}\n`;
    }
  }

  md += `\n## Что считать успешным результатом аудита\n\n`;
  md += `- 0 ошибок ERROR.\n`;
  md += `- Количество записей в PocketBase и Directus совпадает.\n`;
  md += `- Нет дублей по уникальным ключам.\n`;
  md += `- Нет сиротских связей.\n`;
  md += `- Все relation-поля в Directus являются реальными связями.\n`;
  md += `- Для пользователей есть записи в directus_users, если нужен прод-логин.\n`;

  fs.writeFileSync(OUT, md, 'utf8');

  console.log(md);
  console.log(`Отчёт сохранён: ${OUT}`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(2);
});