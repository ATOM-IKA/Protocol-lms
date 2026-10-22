import { getItems, asId, relStr, relId, relNum } from '@/shared/api/directus'
import { groupCode } from '@/shared/lib/group'
export interface LeaderRow { id: string; userId: string; name: string; xp: number; level: number; rank: string; groupCode: string }
interface Rec { id: unknown; user?: unknown; name?: string; xp?: number; level?: number; rank?: string; institution?: unknown; group?: unknown }
export async function fetchLeaderboard(institutionId?: string, limit = 100): Promise<LeaderRow[]> {
  const list = await getItems<Rec>('leaderboard', { sort: '-xp', limit, fields: ['*', 'group.id', 'group.specialty', 'group.start_year', 'group.index'], ...(institutionId ? { filter: { institution: { _eq: asId(institutionId) } } } : {}) })
  return list.map((r) => ({ id: String(r.id), userId: relId(r.user), name: r.name ?? 'USER', xp: r.xp ?? 0, level: r.level ?? 1, rank: r.rank ?? 'F', groupCode: relStr(r.group, 'specialty') ? groupCode(relStr(r.group, 'specialty'), relNum(r.group, 'start_year'), relNum(r.group, 'index', 1)) : '' }))
}