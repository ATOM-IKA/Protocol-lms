import { getSingleton } from '@/shared/api/directus'

export interface PublicStats { courses: number; students: number; hours: number }
interface StatsRec { courses?: number; students?: number; hours?: number; updated_at?: string | null }

/**
 * Публичная витрина для главной. Анонимный посетитель не имеет доступа к курсам и пользователям,
 * поэтому числа читаются из одной записи `site_stats`, которую пересчитывает сервер
 * (directus/refresh-stats.mjs, позже — расширение). null — витрина ещё не посчитана или недоступна:
 * тогда блок со счётчиками просто не показываем.
 */
export async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const r = await getSingleton<StatsRec>('site_stats')
    if (!r || r.updated_at == null) return null
    return { courses: r.courses ?? 0, students: r.students ?? 0, hours: r.hours ?? 0 }
  } catch {
    return null
  }
}
