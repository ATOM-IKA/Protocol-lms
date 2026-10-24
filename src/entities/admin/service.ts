import { getItems, getCount, createRec, updateRec, deleteRec, asId, relStr, relId, relNum, usersRead, usersCount, userCreate, userUpdate, userDelete, roleId } from '@/shared/api/directus'
import { groupCode } from '@/shared/lib/group'
import { useAuthStore } from '@/features/auth/authStore'
import { emailForNewUser } from '@/features/auth/loginIdentity'
import type { UserRole } from '@/entities/user/types'
import type { Institution } from '@/entities/institution/types'

export interface AdminStats { users: number; students: number; teachers: number; admins: number; institutions: number; courses: number; enrollments: number; submissions: number }
const roleFilter = (name: UserRole, institution?: string) => ({ role: { name: { _eq: name } }, ...(institution ? { institution: { _eq: asId(institution) } } : {}) })
export async function fetchStats(institution?: string): Promise<AdminStats> {
  const uF = institution ? { institution: { _eq: asId(institution) } } : undefined
  const cF = institution ? { course: { institution: { _eq: asId(institution) } } } : undefined
  const [users, students, teachers, admins, institutions, courses, enrollments, submissions] = await Promise.all([
    usersCount(uF),
    usersCount(roleFilter('student', institution)),
    usersCount(roleFilter('teacher', institution)),
    usersCount(roleFilter('admin', institution)),
    institution ? Promise.resolve(1) : getCount('institutions'),
    getCount('courses', uF),
    getCount('enrollments', cF),
    getCount('submissions', cF),
  ])
  return { users, students, teachers, admins, institutions, courses, enrollments, submissions }
}

export interface AdminUser { id: string; email: string; fullName: string; studentId: string; callsign: string; role: UserRole; institutionId: string; institutionShort: string; groupId: string; groupCode: string; coins: number; xp: number; level: number }
interface UserRec { id: unknown; email?: string; full_name?: string; student_id?: string; callsign?: string; role?: { name?: UserRole } | null; institution?: unknown; group?: unknown; coins?: number; xp?: number; level?: number }
const USER_FIELDS = ['id', 'email', 'full_name', 'student_id', 'callsign', 'role.name', 'coins', 'xp', 'level', 'institution.id', 'institution.short_name', 'group.id', 'group.specialty', 'group.start_year', 'group.index']
const mapUser = (r: UserRec): AdminUser => ({ id: String(r.id), email: r.email ?? '', fullName: r.full_name ?? '', studentId: r.student_id ?? '', callsign: r.callsign ?? '', role: r.role?.name ?? 'student', institutionId: relId(r.institution), institutionShort: relStr(r.institution, 'short_name'), groupId: relId(r.group), groupCode: relStr(r.group, 'specialty') ? groupCode(relStr(r.group, 'specialty'), relNum(r.group, 'start_year'), relNum(r.group, 'index', 1)) : '', coins: r.coins ?? 0, xp: r.xp ?? 0, level: r.level ?? 1 })
export async function fetchUsers(institution?: string): Promise<AdminUser[]> {
  const list = await usersRead<UserRec>({ fields: USER_FIELDS, limit: -1, ...(institution ? { filter: { institution: { _eq: asId(institution) } } } : {}) })
  return list.map(mapUser)
}
export interface NewUser { email: string; password: string; fullName: string; studentId: string; callsign: string; role: UserRole; institutionId: string; groupId?: string }
/**
 * Пользователь один (directus_users), пароль хеширует Directus. Админ колледжа НЕ присылает колледж —
 * его подставляет сервер; колледж задаёт только супер-админ. Email можно не вводить: для входа по номеру
 * строится служебный адрес.
 */
const isSuper = () => useAuthStore.getState().user?.role === 'superadmin'
export async function createUser(i: NewUser): Promise<void> {
  await userCreate({
    email: emailForNewUser(i.email, i.studentId), password: i.password, status: 'active', role: await roleId(i.role),
    full_name: i.fullName, student_id: i.studentId, callsign: i.callsign || i.studentId,
    ...(isSuper() && i.institutionId ? { institution: asId(i.institutionId) } : {}),
    ...(i.groupId ? { group: asId(i.groupId) } : {}),
  })
}
export interface UserPatch { fullName?: string; role?: UserRole; institutionId?: string; groupId?: string }
export async function updateUser(id: string, p: UserPatch): Promise<void> {
  const b: Record<string, unknown> = {}
  if (p.fullName !== undefined) b.full_name = p.fullName
  if (p.role !== undefined) b.role = await roleId(p.role)
  if (p.institutionId !== undefined && isSuper()) b.institution = asId(p.institutionId)
  if (p.groupId !== undefined) b.group = p.groupId ? asId(p.groupId) : null
  await userUpdate(id, b)
}
export const deleteUser = (id: string) => userDelete(id)

export interface AdminGroup { id: string; specialty: string; index: number; startYear: number; code: string; curatorId: string; curatorName: string; institutionId: string }
interface GroupRec { id: unknown; specialty: string; index?: number; start_year: number; curator?: unknown; institution?: unknown }
const GROUP_FIELDS = ['*', 'curator.id', 'curator.full_name', 'curator.student_id']
const mapGroup = (r: GroupRec): AdminGroup => ({ id: String(r.id), specialty: r.specialty, index: r.index ?? 1, startYear: r.start_year, code: groupCode(r.specialty, r.start_year, r.index ?? 1), curatorId: relId(r.curator), curatorName: relStr(r.curator, 'full_name') || relStr(r.curator, 'student_id'), institutionId: relId(r.institution) })
export async function fetchGroups(institution?: string): Promise<AdminGroup[]> {
  const list = await getItems<GroupRec>('groups', { fields: GROUP_FIELDS, ...(institution ? { filter: { institution: { _eq: asId(institution) } } } : {}) })
  return list.map(mapGroup).sort((a, b) => a.code.localeCompare(b.code))
}
export interface NewGroup { specialty: string; index: number; startYear: number; curatorId?: string; institutionId?: string }
export const createGroup = (i: NewGroup) => createRec('groups', { specialty: i.specialty, index: i.index, start_year: i.startYear, ...(i.curatorId ? { curator: asId(i.curatorId) } : {}), ...(useAuthStore.getState().user?.role === 'superadmin' && i.institutionId ? { institution: asId(i.institutionId) } : {}) }).then(() => {})
export const updateGroup = (id: string, p: Partial<NewGroup>) => { const b: Record<string, unknown> = {}; if (p.specialty !== undefined) b.specialty = p.specialty; if (p.index !== undefined) b.index = p.index; if (p.startYear !== undefined) b.start_year = p.startYear; if (p.curatorId !== undefined) b.curator = asId(p.curatorId); return updateRec('groups', id, b).then(() => {}) }
export const deleteGroup = (id: string) => deleteRec('groups', id)

export interface AuditLog { id: string; user: string; action: string; target: string; created: string }
interface AuditRec { id: unknown; actor?: unknown; action: string; target?: string; meta?: unknown; created?: string }
export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const list = await getItems<AuditRec>('audit_logs', { sort: '-created', limit: 100, fields: ['*'] })
  return list.map((r) => ({ id: String(r.id), user: relId(r.actor), action: r.action, target: r.target ?? '', created: r.created ?? '' }))
}
export async function fetchAuditForExport(opts: { user?: string; from?: string; to?: string }): Promise<AuditLog[]> {
  const f: Record<string, unknown> = {}
  if (opts.user) f.actor = { _eq: asId(opts.user) }
  const range: unknown[] = []
  if (opts.from) range.push({ created: { _gte: opts.from + ' 00:00:00' } })
  if (opts.to) range.push({ created: { _lte: opts.to + ' 23:59:59' } })
  if (range.length) f._and = range
  const list = await getItems<AuditRec>('audit_logs', { filter: Object.keys(f).length ? f : undefined, sort: '-created', limit: 2000, fields: ['*'] })
  return list.map((r) => ({ id: String(r.id), user: relId(r.actor), action: r.action, target: r.target ?? '', created: r.created ?? '' }))
}

export const createInstitution = (name: string, shortName: string) => createRec('institutions', { name, short_name: shortName }).then(() => {})
export const updateInstitution = (id: string, p: Partial<Institution>) => { const b: Record<string, unknown> = {}; if (p.name !== undefined) b.name = p.name; if (p.shortName !== undefined) b.short_name = p.shortName; return updateRec('institutions', id, b).then(() => {}) }
export const deleteInstitution = (id: string) => deleteRec('institutions', id)

export interface AdminCourse { id: string; title: string; status: 'draft' | 'published'; ownerName: string; institutionShort: string; sections: number; lessons: number }
interface CourseModRec { id: unknown; title: string; status?: 'draft' | 'published'; owner?: unknown; institution?: unknown }
interface RelRec { id: unknown; course?: unknown }
export async function fetchAdminCourses(institution?: string): Promise<AdminCourse[]> {
  const [courses, sections, lessons] = await Promise.all([
    getItems<CourseModRec>('courses', { fields: ['*', 'owner.id', 'owner.full_name', 'owner.student_id', 'institution.id', 'institution.short_name'], ...(institution ? { filter: { institution: { _eq: asId(institution) } } } : {}) }),
    getItems<RelRec>('sections', { fields: ['id', 'course'] }),
    getItems<RelRec>('lessons', { fields: ['id', 'course'] }),
  ])
  return courses.map((c) => ({ id: String(c.id), title: c.title, status: c.status ?? 'draft', ownerName: relStr(c.owner, 'full_name') || relStr(c.owner, 'student_id') || '—', institutionShort: relStr(c.institution, 'short_name') || '—', sections: sections.filter((s) => relId(s.course) === String(c.id)).length, lessons: lessons.filter((l) => relId(l.course) === String(c.id)).length }))
}
export const setCourseStatus = (id: string, status: 'draft' | 'published') => updateRec('courses', id, { status }).then(() => {})
export const deleteCourseAdmin = (id: string) => deleteRec('courses', id)