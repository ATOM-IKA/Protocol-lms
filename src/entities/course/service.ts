import { getItems, getItem, createRec, updateRec, deleteRec, asId, contentToStr } from '@/shared/api/directus'
import type { Course, CourseAccent, CourseStatus, Lesson, LessonType, Section } from './types'

interface CourseRec { id: unknown; title: string; subtitle?: string; category?: string; icon?: string; instructor?: string; owner?: unknown; institution?: unknown; status?: CourseStatus; total_hours?: number; accent?: CourseAccent }
interface SectionRec { id: unknown; course?: unknown; title: string; order?: number }
interface LessonRec { id: unknown; course?: unknown; section?: unknown; title: string; type?: LessonType; duration_hours?: number; xp?: number; order?: number; content?: unknown; open?: boolean; submission?: boolean }

function toCourse(c: CourseRec, sections: SectionRec[], lessons: LessonRec[]): Course {
  const cid = String(c.id)
  const secs: Section[] = sections
    .filter((s) => String(s.course) === cid)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => ({
      id: String(s.id), title: s.title,
      lessons: lessons.filter((l) => String(l.section) === String(s.id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((l): Lesson => ({ id: String(l.id), title: l.title, type: (l.type ?? 'lecture') as LessonType, durationHours: l.duration_hours ?? 0, xp: l.xp ?? 0, content: contentToStr(l.content), open: !!l.open, submission: !!l.submission })),
    }))
  return { id: cid, title: c.title, subtitle: c.subtitle ?? '', category: c.category ?? '', icon: c.icon || 'code', instructor: c.instructor ?? '', ownerId: String(c.owner ?? ''), institutionShort: '', status: c.status ?? 'draft', totalHours: c.total_hours ?? 0, accent: c.accent || 'aqua', sections: secs }
}

export async function fetchCourses(): Promise<Course[]> {
  const [courses, sections, lessons] = await Promise.all([
    getItems<CourseRec>('courses', { fields: ['*'] }),
    getItems<SectionRec>('sections', { fields: ['*'] }),
    getItems<LessonRec>('lessons', { fields: ['*'] }),
  ])
  return courses.map((c) => toCourse(c, sections, lessons))
}
export async function fetchCourse(id: string): Promise<Course | null> {
  try {
    const c = await getItem<CourseRec>('courses', id)
    const [sections, lessons] = await Promise.all([
      getItems<SectionRec>('sections', { filter: { course: { _eq: asId(id) } }, fields: ['*'] }),
      getItems<LessonRec>('lessons', { filter: { course: { _eq: asId(id) } }, fields: ['*'] }),
    ])
    return toCourse(c, sections, lessons)
  } catch { return null }
}

export async function createCourse(ownerId: string, instructor: string, institutionId: string): Promise<string> {
  const rec = await createRec<CourseRec>('courses', { title: 'Новый курс', subtitle: 'Краткое описание', category: 'Разработка', icon: 'code', accent: 'aqua', instructor, owner: asId(ownerId), institution: asId(institutionId), status: 'draft', total_hours: 0 })
  return String(rec.id)
}
export async function updateCourse(id: string, patch: Partial<Course>): Promise<void> {
  const b: Record<string, unknown> = {}
  if (patch.title !== undefined) b.title = patch.title
  if (patch.subtitle !== undefined) b.subtitle = patch.subtitle
  if (patch.category !== undefined) b.category = patch.category
  if (patch.accent !== undefined) b.accent = patch.accent
  if (patch.instructor !== undefined) b.instructor = patch.instructor
  if (patch.status !== undefined) b.status = patch.status
  if (patch.totalHours !== undefined) b.total_hours = patch.totalHours
  await updateRec('courses', id, b)
}
export const deleteCourse = (id: string) => deleteRec('courses', id)
export const addSection = (courseId: string, order: number) => createRec('sections', { course: asId(courseId), title: 'Новый раздел', order }).then(() => {})
export const updateSection = (id: string, title: string) => updateRec('sections', id, { title }).then(() => {})
export const deleteSection = (id: string) => deleteRec('sections', id)
export const addLesson = (courseId: string, sectionId: string, order: number) =>
  createRec('lessons', { course: asId(courseId), section: asId(sectionId), title: 'Новый урок', type: 'lecture', duration_hours: 2, xp: 10, order, open: false, submission: false }).then(() => {})
export async function updateLesson(id: string, patch: Partial<Lesson>): Promise<void> {
  const b: Record<string, unknown> = {}
  if (patch.title !== undefined) b.title = patch.title
  if (patch.type !== undefined) b.type = patch.type
  if (patch.durationHours !== undefined) b.duration_hours = patch.durationHours
  if (patch.xp !== undefined) b.xp = patch.xp
  if (patch.content !== undefined) b.content = patch.content
  if (patch.open !== undefined) b.open = patch.open
  if (patch.submission !== undefined) b.submission = patch.submission
  await updateRec('lessons', id, b)
}
export const deleteLesson = (id: string) => deleteRec('lessons', id)