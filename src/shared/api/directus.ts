import {
  createDirectus, rest, authentication, staticToken,
  readItems, readItem, createItem as diCreate, updateItem as diUpdate,
  deleteItem as diDelete, readMe,
  createUser as diCreateUser, updateUser as diUpdateUser, deleteUser as diDeleteUser, readUsers, readRoles, readSingleton,
} from '@directus/sdk'
import { env, isDevAuth } from '@/shared/config/env'
import { groupCode } from '@/shared/lib/group'
import { identityToEmail } from '@/features/auth/loginIdentity'
import { useAuthStore, type AuthUser, type Role } from '@/features/auth/authStore'

export const DIRECTUS_URL = env.directusUrl

const TOKEN_KEY = 'protocol-directus-auth'
/** Хранилище сессии для SDK: объект {access_token, refresh_token, expires…} ↔ JSON. */
const storage = {
  get: () => { try { const raw = localStorage.getItem(TOKEN_KEY); return raw ? JSON.parse(raw) : null } catch { return null } },
  set: (v: unknown) => { try { if (v) localStorage.setItem(TOKEN_KEY, JSON.stringify(v)); else localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } },
}

// any намеренно: staticToken-/authentication-клиенты дают union-тип, шумящий в tsc;
// сами операции (readItems и пр.) типизированы.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client: any = isDevAuth
  ? createDirectus(DIRECTUS_URL).with(rest()).with(staticToken(env.directusStaticToken))
  : createDirectus(DIRECTUS_URL).with(rest()).with(authentication('json', { storage } as never))

const req = <T,>(op: unknown): Promise<T> => client.request(op) as Promise<T>

// ---------- id-хелперы (Directus id = integer, фронт работает со строками) ----------
export const asId = (v: unknown): string | number => {
  if (v == null) return ''
  if (typeof v === 'number') return v
  const s = String(v)
  return /^\d+$/.test(s) ? Number(s) : s
}
export const relId = (v: unknown): string => {
  if (v == null) return ''
  if (typeof v === 'object') return String((v as { id?: unknown }).id ?? '')
  return String(v)
}
export const relStr = (v: unknown, field: string): string => {
  if (v == null || typeof v !== 'object') return ''
  return String((v as Record<string, unknown>)[field] ?? '')
}
export const relNum = (v: unknown, field: string, fb = 0): number => {
  if (v == null || typeof v !== 'object') return fb
  const n = Number((v as Record<string, unknown>)[field])
  return Number.isFinite(n) ? n : fb
}
export const parseJson = <T,>(v: unknown, fb: T): T => {
  if (v == null || v === '') return fb
  if (typeof v === 'string') { try { return JSON.parse(v) as T } catch { return fb } }
  return v as T
}
export const contentToStr = (v: unknown): string =>
  typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v)

/**
 * Владельца новой записи (owner/author/student/колледж) подставляет СЕРВЕР, клиент его не присылает
 * (иначе Directus ответит 403). Исключение — супер-админ: у него нет заготовок, он указывает явно.
 */
export const ownerFields = (fields: Record<string, unknown>): Record<string, unknown> =>
  useAuthStore.getState().user?.role === 'superadmin' ? fields : {}

/**
 * Поля человека во вложенном запросе (`student.…`, `author.…`). Студенческий номер — это логин,
 * студенту чужой номер недоступен по правам (иначе весь запрос получил бы 403).
 */
export const personFields = (prefix: string): string[] => {
  const base = [`${prefix}.id`, `${prefix}.full_name`, `${prefix}.callsign`]
  return useAuthStore.getState().user?.role === 'student' ? base : [...base, `${prefix}.student_id`]
}

// ---------- CRUD-обёртки (семантика PB-методов) ----------
export type Q = { filter?: object; sort?: string | string[]; fields?: (string | object)[]; limit?: number; offset?: number }
export const getItems = <T,>(collection: string, q: Q = {}) => req<T[]>(readItems(collection as never, q as never))
export const getItem = <T,>(collection: string, id: string | number, q: Q = {}) => req<T>(readItem(collection as never, asId(id), q as never))
export const createRec = <T,>(collection: string, data: object) => req<T>(diCreate(collection as never, data as never))
export const updateRec = <T,>(collection: string, id: string | number, data: object) => req<T>(diUpdate(collection as never, asId(id), data as never))
export const deleteRec = (collection: string, id: string | number) => req<void>(diDelete(collection as never, asId(id)))
export const getFirst = async <T,>(collection: string, filter: object, fields?: (string | object)[]): Promise<T | undefined> => {
  const list = await getItems<T>(collection, { filter, fields, limit: 1 })
  return list[0]
}
export const getSingleton = <T,>(collection: string) => req<T>(readSingleton(collection as never))
export const getCount = async (collection: string, filter?: object): Promise<number> => {
  const list = await getItems<{ id: unknown }>(collection, { fields: ['id'], filter, limit: -1 })
  return list.length
}

// ---------- файлы ----------
export async function uploadFile(file: File, token?: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const t = token ?? (isDevAuth ? env.directusStaticToken : ((await client.getToken?.()) ?? ''))
  const res = await fetch(`${DIRECTUS_URL}/files`, {
    method: 'POST', headers: t ? { Authorization: `Bearer ${t}` } : {}, body: fd,
  })
  if (!res.ok) throw new Error(`uploadFile ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return String(data.data?.id ?? data.id ?? '')
}
export const assetUrl = (id: string | number): string => `${DIRECTUS_URL}/assets/${asId(id)}`

// ---------- авторизация ----------
// Пользователь один — встроенный directus_users (+ наши поля); роль — role.name одной из четырёх ролей.
interface RawUser {
  id: unknown; email?: string; full_name?: string; callsign?: string; student_id?: string
  role?: { name?: string } | string | null; coins?: number; institution?: unknown; group?: unknown; created?: string
}
function mapAuthUser(rec: RawUser): AuthUser {
  const inst = rec.institution as { short_name?: string; name?: string } | undefined
  const g = rec.group as { specialty?: string; start_year?: number; index?: number; curator?: { full_name?: string } } | undefined
  const roleName = typeof rec.role === 'object' && rec.role ? rec.role.name : rec.role
  return {
    id: relId(rec.id),
    callsign: rec.callsign || rec.student_id || rec.full_name || 'USER',
    fullName: rec.full_name ?? '',
    role: (roleName as Role) ?? 'student',
    institutionShort: inst?.short_name ?? '',
    institutionName: inst?.name ?? '',
    institutionId: relId(rec.institution),
    coins: Number(rec.coins ?? 0),
    groupCode: g?.specialty ? groupCode(g.specialty, Number(g.start_year) || 0, Number(g.index) || 1) : '',
    groupId: relId(g),
    curatorName: g?.curator?.full_name || '',
    studentId: rec.student_id ?? '',
    email: rec.email ?? '',
    createdAt: rec.created ?? '',
  }
}
// Явный список полей: пароль и служебные колонки в браузер не тянем. Поля других людей (email, номер) студенту недоступны по правам.
const PROFILE_FIELDS = ['id', 'email', 'full_name', 'callsign', 'student_id', 'coins', 'created', 'role.id', 'role.name', 'institution.id', 'institution.short_name', 'institution.name', 'group.id', 'group.specialty', 'group.start_year', 'group.index', 'group.curator.id', 'group.curator.full_name']
// студенту поле student_id/email своего профиля прав на чтение не даёт (логин он знает сам) — берём только разрешённое
const STUDENT_SAFE_FIELDS = PROFILE_FIELDS.filter((f) => f !== 'email' && f !== 'student_id')

async function fetchMe(): Promise<AuthUser> {
  // 1) безопасный минимум, доступный любой роли: узнаём роль.
  // 2) полный набор полей — для неё. ВАЖНО: если попросить у /users/me поле, которого у роли нет в правах,
  //    Directus не отвечает ошибкой, а молча отдаёт почти пустой объект — поэтому запрашиваем строго по роли.
  const base = await req<RawUser>(readMe({ fields: ['id', 'role.name'] } as never))
  const roleName = typeof base?.role === 'object' && base.role ? base.role.name : undefined
  if (!base?.id || !roleName) throw new Error('Профиль не найден')
  const me = await req<RawUser>(readMe({ fields: roleName === 'student' ? STUDENT_SAFE_FIELDS : PROFILE_FIELDS } as never))
  if (!me?.id) throw new Error('Профиль не найден')
  return mapAuthUser(me)
}

/** HTTP-статус из ошибки SDK (undefined — сеть недоступна). */
export const httpStatus = (e: unknown): number | undefined =>
  (e as { response?: { status?: number } })?.response?.status

/**
 * DEV (шаг 1): резолв по email ИЛИ student_id без проверки пароля. Работает только вместе со статик-токеном
 * и только вне PROD-сборки (см. env.ts).
 */
export async function loginDev(identity: string): Promise<AuthUser> {
  const list = await req<RawUser[]>(readUsers({ filter: { _or: [{ email: { _eq: identityToEmail(identity) } }, { student_id: { _eq: identity } }] }, fields: PROFILE_FIELDS, limit: 1 } as never))
  if (!list[0]) throw new Error('Пользователь не найден')
  return mapAuthUser(list[0])
}

/** PROD: вход по номеру (служебный email) или по почте; пароль проверяет Directus. */
export async function loginProd(identity: string, password: string): Promise<AuthUser> {
  await client.login({ email: identityToEmail(identity), password }) // сохраняет сессию в клиенте и в storage
  try { return await fetchMe() } catch (e) { await logoutAuth(); throw e }
}
export const login = (identity: string, password: string) => isDevAuth ? loginDev(identity) : loginProd(identity, password)

export async function logoutAuth(): Promise<void> {
  if (!isDevAuth) { try { await client.logout() } catch { /* сессия уже недействительна */ } }
  storage.set(null)
}

export type Restored = { status: 'ok'; user: AuthUser } | { status: 'anonymous' } | { status: 'offline' }
/** ok — сессия жива; anonymous — токена нет или он недействителен; offline — сервер недоступен (кэш не сбрасываем). */
export async function restoreProfile(): Promise<Restored> {
  if (isDevAuth) return { status: 'offline' } // в dev профиль уже в localStorage (authStore)
  if (!storage.get()) return { status: 'anonymous' }
  try {
    return { status: 'ok', user: await fetchMe() }
  } catch (e) {
    const code = httpStatus(e)
    if (code === 401 || code === 403) { storage.set(null); return { status: 'anonymous' } }
    return { status: 'offline' }
  }
}

// ---------- пользователи (directus_users) ----------
export const usersRead = <T,>(q: Q = {}) => req<T[]>(readUsers(q as never))
export const usersCount = async (filter?: object): Promise<number> => (await usersRead<{ id: unknown }>({ fields: ['id'], filter, limit: -1 })).length
export const userCreate = (data: object) => req<{ id: string }>(diCreateUser(data as never))
export const userUpdate = (id: string, data: object) => req<void>(diUpdateUser(id as never, data as never))
export const userDelete = (id: string) => req<void>(diDeleteUser(id as never))

let rolesCache: Record<string, string> | null = null
/** uuid роли по имени (student | teacher | admin | superadmin) — нужен при создании/смене роли пользователя. */
export async function roleId(name: Role): Promise<string> {
  rolesCache ??= Object.fromEntries((await req<{ id: string; name: string }[]>(readRoles({ fields: ['id', 'name'], limit: -1 } as never))).map((r) => [r.name, r.id]))
  const id = rolesCache[name]
  if (!id) throw new Error(`Роль «${name}» не найдена в Directus`)
  return id
}
