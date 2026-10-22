import { useMemo } from 'react'
import { usePublishedCourses } from '@/features/courses/useCourses'
import { useAuthStore } from '@/features/auth/authStore'
import { useMyEnrollments } from '@/features/enrollment/useEnrollment'
import { useMyLessonMarks } from '@/features/submission/useSubmissions'
import { useMyBoardXp } from '@/features/board/useBoard'
import { useMyQuizXp } from '@/features/quiz/useQuiz'
import { courseLessons } from '@/entities/course/lib'
import { isPassed, lessonXp } from './passed'
import { levelFromXp, rankFromLevel } from '@/shared/lib/levels'

export interface XpState {
  xp: number
  level: number
  inLevel: number
  forNext: number
  rank: ReturnType<typeof rankFromLevel>
  completedCount: number
  hours: number
}

/**
 * Прогресс студента: опыт и часы по пройденным урокам (оценка ≥ 3 для заданий,
 * открытие для лекций) в рамках записанных курсов. Опыт масштабируется от оценки.
 */
export function useXp(): XpState {
  const user = useAuthStore((s) => s.user)
  const isStudent = user?.role === 'student'
  const { data: courses = [] } = usePublishedCourses()
  const { data: enrollments = [] } = useMyEnrollments(user?.id ?? '', !!isStudent)
  const { data: marks = {} } = useMyLessonMarks(user?.id ?? '', !!isStudent)
  const { data: boardXp = 0 } = useMyBoardXp(user?.id ?? '', !!isStudent)
  const { data: quizXp = 0 } = useMyQuizXp(user?.id ?? '', !!isStudent)

  return useMemo(() => {
    const enrolled = new Set(enrollments.map((e) => e.courseId))
    let xp = 0
    let hours = 0
    let completedCount = 0
    for (const course of courses) {
      if (!enrolled.has(course.id)) continue
      for (const lesson of courseLessons(course)) {
        if (isPassed(lesson, marks)) {
          xp += lessonXp(lesson, marks)
          hours += lesson.durationHours
          completedCount++
        }
      }
    }
    xp += boardXp // опыт за принятые задания с доски
    xp += quizXp // опыт за пройденные тесты
    const { level, inLevel, forNext } = levelFromXp(xp)
    return { xp, level, inLevel, forNext, rank: rankFromLevel(level), completedCount, hours }
  }, [courses, enrollments, marks, boardXp, quizXp])
}
