import { getItems, updateRec, asId } from '@/shared/api/directus'
export type NotifKind = 'grade' | 'board' | 'system'
export interface Notif { id: string; kind: NotifKind; title: string; text: string; link: string; read: boolean; created: string }
interface Rec { id: unknown; kind?: NotifKind; title: string; text?: string; link?: string; read?: boolean; created?: string }
const map = (r: Rec): Notif => ({ id: String(r.id), kind: r.kind ?? 'system', title: r.title, text: r.text ?? '', link: r.link ?? '', read: !!r.read, created: r.created ?? '' })
export async function fetchMyNotifications(userId: string): Promise<Notif[]> {
  return (await getItems<Rec>('notifications', { filter: { user: { _eq: asId(userId) } }, sort: '-created', limit: 40, fields: ['*'] })).map(map)
}
export const markNotifRead = (id: string) => updateRec('notifications', id, { read: true }).then(() => {})
export async function markAllNotifsRead(userId: string): Promise<void> {
  const list = await getItems<Rec>('notifications', { filter: { user: { _eq: asId(userId) }, read: { _eq: false } }, fields: ['id'] })
  for (const r of list) await updateRec('notifications', String(r.id), { read: true })
}