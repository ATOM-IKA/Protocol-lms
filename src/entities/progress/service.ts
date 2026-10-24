import { getItems, getFirst, createRec, updateRec, asId } from '@/shared/api/directus'
interface Rec { id: unknown; lesson?: unknown; completed?: boolean }
const rid = (v: unknown) => String(typeof v === 'object' && v ? (v as { id?: unknown }).id : v ?? '')
export async function fetchServerProgress(courseId: string, studentId: string): Promise<Record<string, boolean>> {
  const list = await getItems<Rec>('session_progress', { filter: { student: { _eq: asId(studentId) }, course: { _eq: asId(courseId) } }, fields: ['*'] })
  const m: Record<string, boolean> = {}
  for (const r of list) if (r.completed) m[rid(r.lesson)] = true
  return m
}
/**
 * Отметка урока на сервере (upsert). NB: XP/level/rank у пользователя и
 * enrollment.progress_percent пересчитает серверный хук ТОЛЬКО после шага 2
 * (Directus Flow). Сейчас пишется только completed/completed_at.
 */
export async function setLessonDone(courseId: string, studentId: string, lessonId: string, done: boolean): Promise<void> {
  const existing = await getFirst<Rec>('session_progress', { student: { _eq: asId(studentId) }, lesson: { _eq: asId(lessonId) } })
  if (existing) await updateRec('session_progress', String(existing.id), { completed: done })
  else await createRec('session_progress', { course: asId(courseId), lesson: asId(lessonId), completed: done })
}