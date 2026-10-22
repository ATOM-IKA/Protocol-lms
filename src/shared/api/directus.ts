import {
  createDirectus, rest, authentication, staticToken,
  readItems, readItem, createItem as diCreate, updateItem as diUpdate,
  deleteItem as diDelete, login as diLogin, logout as diLogout, readMe,
  createUser as diCreateUser, deleteUser as diDeleteUser,
} from '@directus/sdk'
import { env, isDevAuth } from '@/shared/config/env'
import { groupCode } from '@/shared/lib/group'
import type { AuthUser, Role } from '@/features/auth/authStore'

export const DIRECTUS_URL = env.directusUrl

const TOKEN_KEY = 'protocol-directus-auth'
const storage = {
  get: async () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: async (t: string) => { try { localStorage.setItem(TOKEN_KEY, t) } catch { /* ignore */ } },
  clear: async () => { try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } },
}

// any намеренно: staticToken-/authentication-клиенты дают union-тип, шумящий в tsc;
// сами операции (readItems и пр.) типизированы.
const client: any = isDevAuth
  ? createDirectus(DIRECTUS_URL).with(rest()).with(staticToken(env.directusStaticToken))
  : createDirectus(DIRECTUS_URL).with(rest()).with(authentication({ storage } as any))

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
export const getCount = async (collection: string, filter?: object): Promise<number> => {
  const list = await getItems<{ id: unknown }>(collection, { fields: ['id'], filter, limit: -1 })
  return list.length
}

// ---------- файлы ----------
export async function uploadFile(file: File, token?: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const t = token ?? (isDevAuth ? env.directusStaticToken : ((await storage.get()) ?? ''))
  const res = await fetch(`${DIRECTUS_URL}/files`, {
    method: 'POST', headers: t ? { Authorization: `Bearer ${t}` } : {}, body: fd,
  })
  if (!res.ok) throw new Error(`uploadFile ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return String(data.data?.id ?? data.id ?? '')
}
export const assetUrl = (id: string | number): string => `${DIRECTUS_URL}/assets/${asId(id)}`

// ---------- авторизация ----------
interface RawUser {
  id: unknown; email?: string; full_name?: string; callsign?: string; student_id?: string
  role?: Role; coins?: number; institution?: unknown; group?: unknown
  created?: string
}
function mapAuthUser(rec: RawUser): AuthUser {
  const inst = rec.institution as { short_name?: string; name?: string } | undefined
  const g = rec.group as { specialty?: string; start_year?: number; index?: number; curator?: { full_name?: string; student_id?: string } } | undefined
  return {
    id: relId(rec.id),
    callsign: rec.callsign || rec.student_id || rec.full_name || 'USER',
    fullName: rec.full_name ?? '',
    role: (rec.role as Role) ?? 'student',
    institutionShort: inst?.short_name ?? '',
    institutionName: inst?.name ?? '',
    institutionId: relId(rec.institution),
    coins: Number(rec.coins ?? 0),
    groupCode: g?.specialty ? groupCode(g.specialty, Number(g.start_year) || 0, Number(g.index) || 1) : '',
    groupId: relId(g),
    curatorName: g?.curator?.full_name || g?.curator?.student_id || '',
    studentId: rec.student_id ?? '',
    email: rec.email ?? '',            
    createdAt: rec.created ?? '',    
  }
}
// Явный список полей: поле `password` и прочие служебные колонки в браузер не тянем.
const PROFILE_FIELDS = ['id', 'email', 'full_name', 'callsign', 'student_id', 'role', 'coins', 'created', 'institution.id', 'institution.short_name', 'institution.name', 'group.id', 'group.specialty', 'group.start_year', 'group.index', 'group.curator.id', 'group.curator.full_name', 'group.curator.student_id']

/**
 * DEV (шаг 1): резолв по email ИЛИ student_id. Пароль в dev НЕ сверяем:
 * поле `password` кастомной `users` может скрываться/быть не-хешем, а боевая
 * проверка появится в шаге 2 (directus_users + bcrypt). В форме вводишь любой непустой пароль.
 */
export async function loginDev(identity: string, _password: string): Promise<AuthUser> {
  const rec = await getFirst<RawUser>('users', { _or: [{ email: { _eq: identity } }, { student_id: { _eq: identity } }] }, PROFILE_FIELDS)
  if (!rec) throw new Error('Пользователь не найден')
  return mapAuthUser(rec)
}
/**
 * Учётка в directus_users: пароль хешируется Directus, в кастомную `users` он не пишется.
 * Возвращает id созданного пользователя (для отката, если профиль не создался).
 */
export async function createAuthUser(email: string, password: string): Promise<string> {
  const u = await req<{ id: string }>(diCreateUser({ email, password, status: 'active' } as never))
  return String(u.id)
}
export async function deleteAuthUser(id: string): Promise<void> {
  await req(diDeleteUser(id as never))
}

/** PROD (шаг 2): нативный login в directus_users + бизнес-профиль из кастомной users по email. */
export async function loginProd(email: string, password: string): Promise<AuthUser> {
  await req(diLogin({ email, password }))
  const me = await req<{ email?: string }>(readMe())
  const rec = await getFirst<RawUser>('users', { email: { _eq: me.email } }, PROFILE_FIELDS)
  if (!rec) throw new Error('Профиль не найден (проверь policies для роли)')
  return mapAuthUser(rec)
}
export const login = (identity: string, password: string) => isDevAuth ? loginDev(identity, password) : loginProd(identity, password)

export async function logoutAuth(): Promise<void> {
  if (!isDevAuth) { try { await req(diLogout()) } catch { /* ignore */ } }
  storage.clear()
}

export async function restoreProfile(): Promise<AuthUser | null> {
  try {
    if (isDevAuth) return null // в dev профиль уже в localStorage (authStore)
    const t = await storage.get()
    if (!t) return null
    const me = await req<{ email?: string }>(readMe())
    const rec = await getFirst<RawUser>('users', { email: { _eq: me.email } }, PROFILE_FIELDS)
    return rec ? mapAuthUser(rec) : null
  } catch { return null }
}