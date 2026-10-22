import { getItems, asId } from '@/shared/api/directus'
export interface TeacherStats { courses: number; students: number; hours: number }
interface CourseRec { id: unknown; total_hours?: number }
interface EnrollRec { student?: unknown }
const rid = (v: unknown) => String(typeof v === 'object' && v ? (v as { id?: unknown }).id : v ?? '')
export async function fetchTeacherStats(teacherId: string): Promise<TeacherStats> {
  const courses = await getItems<CourseRec>('courses', { filter: { owner: { _eq: asId(teacherId) } }, fields: ['id', 'total_hours'] })
  const ids = courses.map((c) => asId(c.id)).filter((x) => x !== '')
  const hours = courses.reduce((s, c) => s + (c.total_hours ?? 0), 0)
  let students = 0
  if (ids.length) {
    const enrolls = await getItems<EnrollRec>('enrollments', { filter: { course: { _in: ids } }, fields: ['student'] })
    students = new Set(enrolls.map((e) => rid(e.student))).size
  }
  return { courses: courses.length, students, hours }
}