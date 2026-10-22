import type { Course, Lesson } from '@/entities/course/types'
import type { LessonMarks } from '@/entities/submission/service'
import { courseLessons } from '@/entities/course/lib'
import { earnedXp } from '@/shared/lib/grade'

/**
 * Урок пройден студентом, если:
 *  - это задание/чекпоинт (submission) — оценка ≥ 3;
 *  - это лекция (без сдачи) — преподаватель открыл её (open).
 * Самоотметки у студента нет: прохождение определяет преподаватель оценкой.
 */
export function isPassed(lesson: Lesson, marks: LessonMarks): boolean {
  const m = marks[lesson.id]
  if (m) return m.grade >= 3 // работа оценена преподавателем — прохождение по оценке (3–5)
  if (!lesson.submission) return !!lesson.open // лекция без сдачи засчитывается при открытии
  return false // задание без проверки — ещё не пройдено
}

/** Заработанный за урок опыт (0, если не пройден). */
export function lessonXp(lesson: Lesson, marks: LessonMarks): number {
  if (!isPassed(lesson, marks)) return 0
  const m = marks[lesson.id]
  if (m) return earnedXp(lesson.xp, { submission: true, grade: m.grade, retry: m.retry })
  return lesson.xp // лекция, засчитанная по открытию
}

export function coursePassedCount(course: Course, marks: LessonMarks): number {
  return courseLessons(course).filter((l) => isPassed(l, marks)).length
}

export function courseProgress(course: Course, marks: LessonMarks): number {
  const ls = courseLessons(course)
  return ls.length ? Math.round((coursePassedCount(course, marks) / ls.length) * 100) : 0
}

/** Первый открытый непройденный урок — точка, с которой студенту продолжать. */
export function resumeLessonId(course: Course, marks: LessonMarks): string | null {
  for (const l of courseLessons(course)) {
    if (l.open && !isPassed(l, marks)) return l.id
  }
  return null
}
