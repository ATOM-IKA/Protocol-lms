import { getItems, getFirst, createRec, updateRec, asId, relStr, uploadFile, assetUrl } from '@/shared/api/directus'
export type SubmissionStatus = 'submitted' | 'graded'
export interface Submission { id: string; studentId: string; courseId: string; lessonId: string; text: string; files: string[]; fileUrls: string[]; status: SubmissionStatus; grade: number; feedback: string; retry: boolean; submittedAt: string; studentName: string; studentCallsign: string; lessonTitle: string }
interface Rec { id: unknown; student?: unknown; course?: unknown; lesson?: unknown; text?: string; files?: unknown; status?: SubmissionStatus; grade?: number; feedback?: string; retry?: boolean; submitted_at?: string }
const rid = (v: unknown) => String(typeof v === 'object' && v ? (v as { id?: unknown }).id : v ?? '')
function map(r: Rec): Submission {
  const files = Array.isArray(r.files) ? r.files.map((f) => rid(f)).filter(Boolean) : (typeof r.files === 'string' && r.files ? [r.files] : [])
  const s = typeof r.student === 'object' && r.student ? (r.student as { full_name?: string; callsign?: string; student_id?: string }) : undefined
  return { id: String(r.id), studentId: rid(r.student), courseId: rid(r.course), lessonId: rid(r.lesson), text: r.text ?? '', files, fileUrls: files.map(assetUrl), status: r.status ?? 'submitted', grade: r.grade ?? 0, feedback: r.feedback ?? '', retry: !!r.retry, submittedAt: r.submitted_at ?? '', studentName: s?.full_name ?? '', studentCallsign: s?.callsign ?? s?.student_id ?? '', lessonTitle: relStr(r.lesson, 'title') }
}
const SUB_FIELDS = ['*', 'student.id', 'student.full_name', 'student.callsign', 'student.student_id', 'lesson.id', 'lesson.title']
export async function fetchMySubmission(lessonId: string, studentId: string): Promise<Submission | null> {
  const rec = await getFirst<Rec>('submissions', { student: { _eq: asId(studentId) }, lesson: { _eq: asId(lessonId) } }, SUB_FIELDS)
  return rec ? map(rec) : null
}
export interface SubmitInput { id?: string; courseId: string; lessonId: string; studentId: string; text: string; files: File[] }
/**
 * Сдача работы. NB: авто-статус/оценка/`retry`(wasFail)/уведомление преподавателю
 * делает серверный хук — он переносится в шаг 2. Здесь клиент сам ставит
 * стартовые значения, которые в PB проставлял хук onRecordCreateRequest.
 */
export async function submitWork(input: SubmitInput): Promise<void> {
  const fileIds: string[] = []
  for (const f of input.files) fileIds.push(await uploadFile(f))
  const base = { student: asId(input.studentId), course: asId(input.courseId), lesson: asId(input.lessonId), text: input.text, files: fileIds }
  if (input.id) {
    // пересдача студентом: сброс оценки (retry/wasFail — шаг 2)
    await updateRec('submissions', input.id, { ...base, status: 'submitted', grade: 0, feedback: '', graded_at: null, submitted_at: new Date().toISOString() })
  } else {
    await createRec('submissions', { ...base, status: 'submitted', grade: 0, feedback: '', retry: false, submitted_at: new Date().toISOString(), graded_at: null })
  }
}
export async function fetchMyGrades(studentId: string): Promise<number[]> {
  const list = await getItems<Rec>('submissions', { filter: { student: { _eq: asId(studentId) }, status: { _eq: 'graded' } }, fields: ['grade'] })
  return list.map((r) => r.grade ?? 0).filter((g) => g > 0)
}
export interface LessonMark { grade: number; retry: boolean }
export type LessonMarks = Record<string, LessonMark>
export async function fetchMyLessonMarks(studentId: string): Promise<LessonMarks> {
  const list = await getItems<Rec>('submissions', { filter: { student: { _eq: asId(studentId) }, status: { _eq: 'graded' } }, fields: ['*', 'lesson.id'] })
  const marks: LessonMarks = {}
  for (const r of list) marks[rid(r.lesson)] = { grade: r.grade ?? 0, retry: !!r.retry }
  return marks
}
export async function fetchMyCourseSubmissions(courseId: string, studentId: string): Promise<Submission[]> {
  const list = await getItems<Rec>('submissions', { filter: { course: { _eq: asId(courseId) }, student: { _eq: asId(studentId) } }, fields: SUB_FIELDS })
  return list.map(map)
}
export async function fetchCourseSubmissions(courseId: string): Promise<Submission[]> {
  const list = await getItems<Rec>('submissions', { filter: { course: { _eq: asId(courseId) } }, fields: SUB_FIELDS })
  return list.map(map).sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
}
/** Оценка от преподавателя: клиент ставит status/graded_at, которые в PB делал хук. */
export const gradeSubmission = (id: string, grade: number, feedback: string) => updateRec('submissions', id, { grade, feedback, status: 'graded', graded_at: new Date().toISOString() }).then(() => {})
export async function fetchTeacherPassedStudents(teacherId: string): Promise<number> {
  const list = await getItems<Rec>('submissions', { filter: { course: { owner: { _eq: asId(teacherId) } }, status: { _eq: 'graded' }, grade: { _gte: 3 } }, fields: ['student'] })
  return new Set(list.map((r) => rid(r.student))).size
}