import { getItems, getFirst, createRec, deleteRec, asId } from '@/shared/api/directus'
export interface Enrollment { id: string; studentId: string; courseId: string; progressPercent: number; studentName: string; studentCallsign: string }
interface Rec { id: unknown; student?: unknown; course?: unknown; progress_percent?: number }
const rid = (v: unknown) => String(typeof v === 'object' && v ? (v as { id?: unknown }).id : v ?? '')
function map(r: Rec): Enrollment {
  const s = typeof r.student === 'object' && r.student ? (r.student as { full_name?: string; callsign?: string; student_id?: string }) : undefined
  return { id: String(r.id), studentId: rid(r.student), courseId: rid(r.course), progressPercent: r.progress_percent ?? 0, studentName: s?.full_name ?? '', studentCallsign: s?.callsign ?? s?.student_id ?? '' }
}
const STUDENT_FIELDS = ['*', 'student.id', 'student.full_name', 'student.callsign', 'student.student_id']
export async function fetchMyEnrollment(courseId: string, studentId: string): Promise<Enrollment | null> {
  const rec = await getFirst<Rec>('enrollments', { student: { _eq: asId(studentId) }, course: { _eq: asId(courseId) } }, STUDENT_FIELDS)
  return rec ? map(rec) : null
}
export const enroll = (courseId: string, studentId: string) => createRec('enrollments', { student: asId(studentId), course: asId(courseId), enrolled_at: new Date().toISOString(), progress_percent: 0 }).then(() => {})
export async function fetchMyEnrollments(studentId: string): Promise<Enrollment[]> {
  return (await getItems<Rec>('enrollments', { filter: { student: { _eq: asId(studentId) } }, fields: STUDENT_FIELDS })).map(map)
}
export const unenroll = (id: string) => deleteRec('enrollments', id)
export async function fetchCourseEnrollments(courseId: string): Promise<Enrollment[]> {
  return (await getItems<Rec>('enrollments', { filter: { course: { _eq: asId(courseId) } }, fields: STUDENT_FIELDS })).map(map)
}