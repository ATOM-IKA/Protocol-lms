export type LessonType = 'lecture' | 'video' | 'practice' | 'quiz' | 'assignment'
export type CourseStatus = 'draft' | 'published'
export type CourseAccent = 'aqua' | 'lime' | 'teal'

export interface Lesson {
  id: string
  title: string
  type: LessonType
  durationHours: number
  xp: number
  content?: string
  open?: boolean
  /** Урок принимает работы студентов (контрольная точка). Управляется преподавателем. */
  submission?: boolean
}

export interface Section {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Course {
  id: string
  title: string
  subtitle: string
  category: string
  icon: string
  instructor: string
  ownerId: string
  institutionShort: string
  status: CourseStatus
  totalHours: number
  accent: CourseAccent
  sections: Section[]
}
