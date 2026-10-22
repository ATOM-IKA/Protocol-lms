import { getItems } from '@/shared/api/directus'
import type { Institution } from './types'
interface Rec { id: unknown; name: string; short_name: string }
export async function fetchInstitutions(): Promise<Institution[]> {
  const list = await getItems<Rec>('institutions', { sort: 'name', fields: ['*'] })
  return list.map((i) => ({ id: String(i.id), name: i.name, shortName: i.short_name }))
}