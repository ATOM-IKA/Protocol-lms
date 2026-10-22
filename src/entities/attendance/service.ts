import { getItems, getFirst, createRec, updateRec, deleteRec, asId } from '@/shared/api/directus'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export interface AttendanceRec { id: string; courseId: string; lessonId: string; studentId: string; status: AttendanceStatus }
interface Rec { id: unknown; course?: unknown; lesson?: unknown; student?: unknown; status?: AttendanceStatus }
const rid = (v: unknown) => String(typeof v === 'object' && v ? (v as { id?: unknown }).id : v ?? '')
const map = (r: Rec): AttendanceRec => ({ id: String(r.id), courseId: rid(r.course), lessonId: rid(r.lesson), studentId: rid(r.student), status: r.status ?? 'present' })
export async function fetchCourseAttendance(courseId: string): Promise<AttendanceRec[]> {
  return (await getItems<Rec>('attendance', { filter: { course: { _eq: asId(courseId) } }, fields: ['*'] })).map(map)
}
export async function fetchMyAttendance(studentId: string): Promise<AttendanceRec[]> {
  return (await getItems<Rec>('attendance', { filter: { student: { _eq: asId(studentId) } }, fields: ['*'] })).map(map)
}
export async function setAttendance(courseId: string, lessonId: string, studentId: string, status: AttendanceStatus | null): Promise<void> {
  const existing = await getFirst<Rec>('attendance', { lesson: { _eq: asId(lessonId) }, student: { _eq: asId(studentId) } })
  if (status === null) { if (existing) await deleteRec('attendance', String(existing.id)); return }
  if (existing) await updateRec('attendance', String(existing.id), { status })
  else await createRec('attendance', { course: asId(courseId), lesson: asId(lessonId), student: asId(studentId), status, created: new Date().toISOString() })
}