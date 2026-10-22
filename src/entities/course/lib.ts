import type { Course, Lesson } from './types'

export function courseLessons(course: Course): Lesson[] {
  return course.sections.flatMap((s) => s.lessons)
}
