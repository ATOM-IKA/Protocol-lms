#!/usr/bin/env node
// Применяет модель PROTOCOL LMS к Directus 10: роли, поля пользователей, коллекции, связи, права, начальные данные.
//
//   node directus/apply.mjs                 — только показать план (ничего не пишет)
//   node directus/apply.mjs --apply         — применить
//   --reset        пересоздать схему: удалить старые коллекции (только если они пусты)
//   --force        разрешить --reset, даже если в старых таблицах есть записи (УДАЛИТ ДАННЫЕ)
//   --seed-demo    создать по одному тестовому пользователю на роль (пароль берётся из DEMO_PASSWORD — обязателен)
//   --env FILE     файл окружения (по умолчанию .env.audit)
//
// Идемпотентно: повторный запуск ничего не ломает и не дублирует.
import { writeFileSync } from 'node:fs'
import { connect, log } from './lib.mjs'
import {
  ROLES,
  USER_FIELDS,
  COLLECTIONS,
  SUBMISSION_FILES,
  SEED_INSTITUTIONS,
  LOGIN_DOMAIN,
  demoLogin,
  demoPassword,
} from './model.mjs'
import { buildPermissions } from './access.mjs'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d)
const APPLY = has('--apply')
const RESET = has('--reset')
const FORCE = has('--force')
const SEED_DEMO = has('--seed-demo')

const IFACE = {
  string: 'input',
  text: 'input-multiline',
  integer: 'input',
  float: 'input',
  boolean: 'boolean',
  json: 'input-code',
  timestamp: 'datetime',
  uuid: 'input',
}

function fieldPayload(fd, { existingTable = false } = {}) {
  const special = [...(fd.special ?? [])]
  if (fd.type === 'json' && !special.includes('cast-json')) special.push('cast-json')
  if (fd.type === 'boolean' && !special.includes('cast-boolean')) special.push('cast-boolean')
  const isFile = special.includes('file')
  const isM2o = special.includes('m2o')
  const meta = {
    interface: fd.choices
      ? 'select-dropdown'
      : isFile
        ? 'file-image'
        : isM2o
          ? 'select-dropdown-m2o'
          : IFACE[fd.type],
    special: special.length ? special : null,
    required: !!fd.required,
    readonly: !!fd.readonly,
    note: fd.note ?? null,
    width: 'full',
  }
  if (fd.choices) meta.options = { choices: fd.choices.map((v) => ({ text: v, value: v })) }
  if (fd.type === 'json') meta.options = { language: 'json' }
  // в таблицу с уже существующими строками (directus_users) NOT NULL-колонку без значения не добавить
  const schema = {
    is_nullable: existingTable || !fd.required,
    default_value: fd.default ?? null,
    is_unique: !!fd.unique,
  }
  if (fd.type === 'string') schema.max_length = 255
  return { field: fd.field, type: fd.type, meta, schema }
}

const PK = {
  field: 'id',
  type: 'integer',
  meta: { hidden: true, readonly: true, interface: 'input' },
  schema: { is_primary_key: true, has_auto_increment: true },
}

async function main() {
  const dx = await connect({ dryRun: !APPLY, envFile: opt('--env', '.env.audit') })
  if (SEED_DEMO) demoPassword() // без пароля не начинаем (он берётся из окружения)
  console.log(`Directus: ${dx.url}  |  режим: ${APPLY ? 'ПРИМЕНЕНИЕ' : 'только план (dry-run)'}`)
  const info = await dx.get('/server/info').catch(() => null)
  if (info?.version) log.ok(`версия сервера ${info.version}`)

  // ───── текущее состояние ─────
  const existing = new Set(
    (await dx.get('/collections?limit=-1'))
      .map((c) => c.collection)
      .filter((n) => !n.startsWith('directus_')),
  )
  const relations = new Set(
    (await dx.get('/relations?limit=-1')).map((r) => `${r.collection}.${r.field}`),
  )
  const newNames = new Set([...COLLECTIONS.map((c) => c.name), SUBMISSION_FILES.junction])

  // ───── 1. сброс старой схемы ─────
  const stale = [...existing]
  let keptInstitutions = []
  if (stale.length && RESET) {
    log.step('Сброс старой схемы')
    const counts = {}
    for (const c of stale) {
      const r = await dx.get(`/items/${c}?aggregate[count]=*`).catch(() => null)
      counts[c] = Number(r?.[0]?.count ?? 0)
    }
    const withData = stale.filter((c) => counts[c] > 0 && c !== 'institutions')
    if (withData.length && !FORCE) {
      throw new Error(
        `В старых таблицах есть данные (${withData.map((c) => `${c}:${counts[c]}`).join(', ')}). Это удалит их. Запустите с --force, если это точно нужно.`,
      )
    }
    // колледжи сохраняем вместе с id: на них ссылаются пользователи, их пересоздаём ниже
    if (stale.includes('institutions') && counts.institutions > 0) {
      keptInstitutions = (await dx.get('/items/institutions?limit=-1')).map(
        ({ id, name, short_name, default_accent }) => ({
          id,
          name,
          short_name,
          default_accent: default_accent ?? 'aqua',
        }),
      )
      log.ok(
        `сохраняю колледжи для восстановления после сброса: ${keptInstitutions.map((i) => i.short_name).join(', ')}`,
      )
    }
    log.warn(`будут удалены коллекции (${stale.length}): ${stale.join(', ')}`)
    let left = [...stale]
    for (let pass = 0; pass < 8 && left.length; pass++) {
      const next = []
      for (const c of left) {
        try {
          await dx.write('DELETE', `/collections/${c}`, undefined, 'удаление старой коллекции')
          existing.delete(c)
        } catch {
          next.push(c)
        }
      }
      if (next.length === left.length && APPLY)
        throw new Error(`Не удалось удалить: ${next.join(', ')}`)
      left = next
      if (!APPLY) break
    }
    for (const k of [...relations]) if (stale.includes(k.split('.')[0])) relations.delete(k)
    existing.clear()
  } else if (stale.length) {
    const foreign = stale.filter((c) => !newNames.has(c))
    if (foreign.length)
      log.warn(
        `в базе есть лишние коллекции, которых нет в модели: ${foreign.join(', ')} (используйте --reset)`,
      )
  }

  // ───── 2. роли ─────
  log.step('Роли')
  const roleRows = await dx.get('/roles?limit=-1&fields=id,name')
  const ids = {}
  for (const r of ROLES) {
    const found = roleRows.find((x) => x.name === r.name)
    if (found) {
      ids[r.key] = found.id
      log.skip(`роль ${r.name} уже есть`)
      continue
    }
    const made = await dx.write(
      'POST',
      '/roles',
      {
        name: r.name,
        description: r.description,
        admin_access: false,
        app_access: false,
        icon: 'badge',
      },
      `роль ${r.name}`,
    )
    ids[r.key] = made?.id ?? `<id:${r.name}>`
    log.ok(`роль ${r.name}`)
  }

  // ───── 3. коллекции и поля ─────
  log.step('Коллекции и поля')
  const pendingRelations = []
  for (const c of COLLECTIONS) {
    let have = new Set()
    if (!existing.has(c.name)) {
      await dx.write(
        'POST',
        '/collections',
        {
          collection: c.name,
          meta: { note: c.note, icon: 'box', ...(c.singleton ? { singleton: true } : {}) },
          schema: {},
          fields: [PK],
        },
        `коллекция ${c.name}`,
      )
      existing.add(c.name)
      log.ok(`коллекция ${c.name}`)
    } else {
      have = new Set((await dx.get(`/fields/${c.name}`)).map((f) => f.field))
    }
    for (const fd of c.fields) {
      if (!have.has(fd.field))
        await dx.write('POST', `/fields/${c.name}`, fieldPayload(fd), `поле ${c.name}.${fd.field}`)
      if (fd.rel && !relations.has(`${c.name}.${fd.field}`))
        pendingRelations.push({ collection: c.name, field: fd.field, rel: fd.rel })
    }
  }

  // ───── 4. файлы сдач (многие-ко-многим) ─────
  const J = SUBMISSION_FILES.junction
  if (!existing.has(J)) {
    await dx.write(
      'POST',
      '/collections',
      {
        collection: J,
        meta: { hidden: true, icon: 'import_export' },
        schema: {},
        fields: [
          PK,
          { field: 'submissions_id', type: 'integer', schema: {} },
          { field: 'directus_files_id', type: 'uuid', schema: {} },
        ],
      },
      `junction ${J}`,
    )
    existing.add(J)
    log.ok(`junction ${J}`)
  }
  const subFields = new Set(
    (await dx.get('/fields/submissions').catch(() => [])).map((f) => f.field),
  )
  if (!subFields.has('files')) {
    await dx.write(
      'POST',
      '/fields/submissions',
      {
        field: 'files',
        type: 'alias',
        meta: { interface: 'files', special: ['files'] },
        schema: null,
      },
      'поле submissions.files',
    )
  }

  // ───── 5. поля пользователей ─────
  log.step('Поля directus_users')
  const haveU = new Set((await dx.get('/fields/directus_users')).map((f) => f.field))
  for (const fd of USER_FIELDS) {
    if (!haveU.has(fd.field)) {
      await dx.write(
        'POST',
        '/fields/directus_users',
        fieldPayload(fd, { existingTable: true }),
        `поле users.${fd.field}`,
      )
      log.ok(`users.${fd.field}`)
    } else log.skip(`users.${fd.field} уже есть`)
    if (fd.rel && !relations.has(`directus_users.${fd.field}`))
      pendingRelations.push({ collection: 'directus_users', field: fd.field, rel: fd.rel })
  }

  // ───── 6. связи ─────
  log.step(`Связи (${pendingRelations.length + 2})`)
  for (const { collection, field, rel } of pendingRelations) {
    await dx.write(
      'POST',
      '/relations',
      { collection, field, related_collection: rel.to, schema: { on_delete: rel.onDelete } },
      `${collection}.${field} → ${rel.to}`,
    )
  }
  if (!relations.has(`${J}.directus_files_id`)) {
    await dx.write(
      'POST',
      '/relations',
      {
        collection: J,
        field: 'directus_files_id',
        related_collection: 'directus_files',
        meta: { junction_field: 'submissions_id' },
        schema: { on_delete: 'CASCADE' },
      },
      'файлы сдач → directus_files',
    )
  }
  if (!relations.has(`${J}.submissions_id`)) {
    await dx.write(
      'POST',
      '/relations',
      {
        collection: J,
        field: 'submissions_id',
        related_collection: 'submissions',
        meta: { one_field: 'files', junction_field: 'directus_files_id' },
        schema: { on_delete: 'CASCADE' },
      },
      'файлы сдач → submissions',
    )
  }

  // ───── 7. уникальные ключи (Directus API не умеет составные — отдаём SQL) ─────
  const sql = COLLECTIONS.filter((c) => c.unique).map(
    (c) =>
      `CREATE UNIQUE INDEX uq_${c.name}_${c.unique.join('_')} ON \`${c.name}\` (${c.unique.map((f) => `\`${f}\``).join(', ')});`,
  )
  writeFileSync(
    new URL('./indexes.sql', import.meta.url),
    `-- Составные уникальные ключи (сгенерировано apply.mjs). Выполнить один раз после создания схемы.\n${sql.join('\n')}\n`,
  )
  log.step(
    `Уникальные ключи: ${sql.length} (файл directus/indexes.sql — применяется отдельно, см. README)`,
  )

  // ───── 8. права ─────
  log.step('Права ролей')
  const roleIds = Object.values(ids)
  // Directus 10 в списке прав СКЛЕИВАЕТ дубли в одну строку без id, поэтому через список их не удалить.
  // Идём по числовым id от 1 до максимального и удаляем всё, что принадлежит нашим ролям или публичному доступу.
  const maxRow = await dx.get('/permissions?aggregate[max]=id').catch(() => null)
  const maxId = Number(maxRow?.[0]?.max?.id ?? 0)
  let purged = 0
  for (let n = 1; n <= maxId; n++) {
    let row = null
    try {
      row = await dx.get(`/permissions/${n}`)
    } catch {
      continue
    }
    if (!row || !(row.role === null || roleIds.includes(row.role))) continue
    await dx.write('DELETE', `/permissions/${n}`, undefined, 'старое право')
    purged++
  }
  if (purged) console.log(`  удалено старых прав наших ролей: ${purged}`)
  const perms = buildPermissions(ids)
  const seen = new Set()
  for (const p of perms) {
    const k = `${p.role}|${p.collection}|${p.action}`
    if (seen.has(k))
      throw new Error(
        `Дубль права ${k}: Directus 10 применяет только одну запись на роль+таблицу+действие`,
      )
    seen.add(k)
  }
  if (APPLY) await dx.write('POST', '/permissions', perms, `${perms.length} прав`)
  else console.log(`  [dry-run] POST /permissions  — ${perms.length} прав`)
  log.ok(`права: ${perms.length} правил`)

  // ───── 9. начальные данные ─────
  log.step('Начальные данные')
  let instRows = []
  try {
    instRows = (await dx.get('/items/institutions?limit=-1')) ?? []
  } catch {
    /* коллекции ещё нет в dry-run */
  }
  let instId = instRows[0]?.id
  const findInstitution = async (shortName) =>
    (
      await dx
        .get(`/items/institutions?filter[short_name][_eq]=${encodeURIComponent(shortName)}&limit=1`)
        .catch(() => [])
    )?.[0]
  for (const inst of keptInstitutions) {
    if (await findInstitution(inst.short_name)) continue
    await dx.write(
      'POST',
      '/items/institutions',
      inst,
      `восстановление колледжа ${inst.short_name} (id=${inst.id})`,
    )
    instId = inst.id
    log.ok(`колледж ${inst.short_name} восстановлен (id=${inst.id})`)
  }
  for (const inst of SEED_INSTITUTIONS) {
    const found = await findInstitution(inst.short_name)
    if (found) {
      instId = found.id
      log.skip(`колледж ${inst.short_name} уже есть (id=${found.id})`)
      continue
    }
    const made = await dx.write('POST', '/items/institutions', inst, `колледж ${inst.short_name}`)
    instId = made?.id ?? instId
    log.ok(`колледж ${inst.short_name}`)
  }
  const stats = await dx.get('/items/site_stats').catch(() => null)
  if (!stats || stats.updated_at == null) {
    await dx.write(
      'PATCH',
      '/items/site_stats',
      { courses: 0, students: 0, hours: 0 },
      'витрина статистики (начальные нули)',
    )
    log.ok('витрина site_stats создана (числа пересчитывает refresh-stats.mjs / расширение)')
  }
  if (SEED_DEMO) {
    for (const r of ROLES) {
      const email = `${demoLogin(r.key)}@${LOGIN_DOMAIN}` // вход по номеру <роль>-0001
      const exists = (await dx.get(`/users?filter[email][_eq]=${email}&fields=id`).catch(() => []))
        ?.length
      if (exists) {
        log.skip(`${email} уже есть`)
        continue
      }
      await dx.write(
        'POST',
        '/users',
        {
          email,
          password: demoPassword(),
          role: ids[r.key],
          status: 'active',
          first_name: r.name,
          full_name: `Демо ${r.name}`,
          student_id: demoLogin(r.key),
          institution: instId,
        },
        `демо-пользователь ${r.key}`,
      )
      log.ok(`${email}`)
    }
    log.warn(
      `демо-аккаунты (логины <роль>-0001, пароль из DEMO_PASSWORD) — только для теста: удалите их или смените пароли перед боевым запуском`,
    )
  }

  console.log(
    `\nИтого операций записи: ${dx.stats.planned}${APPLY ? `, выполнено: ${dx.stats.done}` : ' (dry-run: ничего не записано)'}`,
  )
  if (!APPLY) console.log('Чтобы применить, добавьте --apply')
}

main().catch((e) => {
  console.error('\n✖ ' + e.message)
  process.exit(1)
})
