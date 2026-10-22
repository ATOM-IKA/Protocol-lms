import { getItems, getCount } from '@/shared/api/directus'

export interface PublicStats { courses: number; students: number; hours: number }
interface ProgRec { lesson?: unknown }
interface LessonRec { id: unknown; duration_hours?: number }
const rid = (v: unknown): string =>
  v == null ? '' : typeof v === 'object' ? String((v as { id?: unknown }).id ?? '') : String(v)

/**
 * Публичные метрики «масштаба платформы» для лендинга/портала — БЕЗ фильтра по
 * колледжу (это не админ-статистика, а витрина). Считаются агрегацией по
 * существующим коллекциям Directus под текущим (в dev — админским) токеном.
 * hours = сумма duration_hours по всем завершённым урокам (session_progress.completed),
 * поэтому НЕ зависит от серверного хука 2.3 — часы выводятся из уже пишемых фронтом записей.
 *
 * NB: getCount/getItems тянут записи целиком (limit:-1) — при маленьких объёмах
 * (сотни уроков/прогрессов) это корректно и просто. На больших данных витрину
 * переведём на серверную агрегацию (Directus aggregate / материализация в 2.x) —
 * заложено, но не блокер сегодня.
 */
export async function fetchPublicStats(): Promise<PublicStats> {
  const [courses, students, progress, lessons] = await Promise.all([
    getCount('courses'),
    getCount('users', { role: { _eq: 'student' } }),
    getItems<ProgRec>('session_progress', { filter: { completed: { _eq: true } }, fields: ['lesson'] }),
    getItems<LessonRec>('lessons', { fields: ['id', 'duration_hours'] }),
  ])
  const hoursById = new Map(lessons.map((l) => [rid(l.id), l.duration_hours ?? 0]))
  const hours = progress.reduce((s, p) => s + (hoursById.get(rid(p.lesson)) ?? 0), 0)
  return { courses, students, hours: Math.round(hours) }
}